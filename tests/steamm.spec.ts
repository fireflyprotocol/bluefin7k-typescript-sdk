import "mocha";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeStructTag, normalizeSuiAddress } from "@mysten/sui/utils";
import { assert } from "chai";
import { SUI_TYPE } from "../src/constants/tokens.js";
import { getConfig } from "../src/features/swap/config.js";
import { buildTx, getQuote, setSuiClient, SourceDex } from "../src/index.js";
import { SteammContract } from "../src/libs/protocols/steamm/index.js";
import { Config } from "../src/types/aggregator.js";

const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

const moveCalls = (tx: Transaction) =>
  tx
    .getData()
    .commands.flatMap((command) =>
      command.$kind === "MoveCall" && command.MoveCall
        ? [command.MoveCall]
        : [],
    );

describe("Steamm PTB shape", () => {
  const SCRIPT = "0x" + "5c".repeat(32);
  const STEAMM = "0x" + "57".repeat(32);
  const ORACLE = "0x" + "0c".repeat(32);
  const MARKET = "0x" + "f9".repeat(32) + "::suilend::MAIN_POOL";
  const B_A = "0x" + "a1".repeat(32) + "::b_a::B_A";
  const B_B = "0x" + "b1".repeat(32) + "::b_b::B_B";
  const LP = "0x" + "c1".repeat(32) + "::lp::LP";
  const COIN_A = "0x2::sui::SUI";
  const COIN_B = "0x" + "d1".repeat(32) + "::usdc::USDC";
  const FEED = "0x" + "11".repeat(32);

  const config = {
    steamm: { name: "Steamm", package: STEAMM, script: SCRIPT, oracle: ORACLE },
  } as unknown as Config;

  const build = (quoter: string, xToY: boolean) => {
    const tx = new Transaction();
    const contract = new SteammContract({
      swapInfo: {
        poolId: "0x" + "11".repeat(32),
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: "1000",
        returnAmount: "900",
        assetIn: xToY ? COIN_A : COIN_B,
        assetOut: xToY ? COIN_B : COIN_A,
        functionName: "swap",
        arguments: [],
        swapXtoY: xToY,
        pool: { allTokens: [], type: "steamm" },
        coinX: { type: COIN_A, decimals: 9 },
        coinY: { type: COIN_B, decimals: 6 },
        extra: {
          poolStructTag: `${STEAMM}::pool::Pool<${B_A}, ${B_B}, ${quoter}, ${LP}>`,
          bankAStructTag: `${STEAMM}::bank::Bank<${MARKET}, ${COIN_A}, ${B_A}>`,
          bankBStructTag: `${STEAMM}::bank::Bank<${MARKET}, ${COIN_B}, ${B_B}>`,
          bankA: "0x" + "33".repeat(32),
          bankB: "0x" + "55".repeat(32),
          lendingMarketA: "0x" + "44".repeat(32),
          lendingMarketB: "0x" + "44".repeat(32),
          oracleRegistry: "0x" + "22".repeat(32),
          oracleIndexes: [0, 1],
          oracles: [
            { Pyth: { bytes: new Array(32).fill(0x11) } },
            { Pyth: { bytes: new Array(32).fill(0x11) } },
          ],
        },
      },
      inputCoinObject: tx.object("0x" + "88".repeat(32)),
      currentAccount: "0x" + "99".repeat(32),
      config,
      pythMap: { [FEED]: "0x" + "66".repeat(32) },
    });
    return { tx, contract };
  };

  it("never targets steamm_scripts, on any quoter", async () => {
    for (const quoter of [
      `${ORACLE}::omm_v2::OracleQuoterV2`,
      `${ORACLE}::omm::OracleQuoter`,
      `${ORACLE}::cpmm::CpQuoter`,
    ]) {
      const { tx, contract } = build(quoter, true);
      await contract.swap(tx);
      assert(
        moveCalls(tx).every(
          (c) => normalizeSuiAddress(c.package) !== normalizeSuiAddress(SCRIPT),
        ),
        `${quoter} still reaches steamm_scripts`,
      );
    }
  });

  it("gives omm_v2::swap its six type arguments in P/A/B/B_A/B_B/LpType order", async () => {
    const { tx, contract } = build(`${ORACLE}::omm_v2::OracleQuoterV2`, true);
    await contract.swap(tx);

    const swap = moveCalls(tx).find(
      (c) => c.module === "omm_v2" && c.function === "swap",
    );
    assert(swap, "omm_v2::swap not emitted");
    assert.equal(
      normalizeSuiAddress(swap.package),
      normalizeSuiAddress(STEAMM),
    );
    assert.deepEqual(
      [...swap.typeArguments],
      [MARKET, COIN_A, COIN_B, B_A, B_B, LP].map(normalizeStructTag),
    );
  });

  it("routes the v1 quoter to omm::swap", async () => {
    const { tx, contract } = build(`${ORACLE}::omm::OracleQuoter`, true);
    await contract.swap(tx);
    const swap = moveCalls(tx).find(
      (c) => c.module === "omm" && c.function === "swap",
    );
    assert(swap, "omm::swap not emitted");
    assert.equal(swap.typeArguments.length, 6);
  });

  it("gives cpmm::swap three type arguments", async () => {
    const { tx, contract } = build(`${ORACLE}::cpmm::CpQuoter`, true);
    await contract.swap(tx);
    const swap = moveCalls(tx).find(
      (c) => c.module === "cpmm" && c.function === "swap",
    );
    assert(swap, "cpmm::swap not emitted");
    assert.deepEqual(
      [...swap.typeArguments],
      [B_A, B_B, LP].map(normalizeStructTag),
    );
  });

  it("cranks fees with Quoter and LpType before the bToken types", async () => {
    const quoter = `${ORACLE}::omm_v2::OracleQuoterV2`;
    for (const xToY of [true, false]) {
      const { tx, contract } = build(quoter, xToY);
      await contract.swap(tx);

      const crank = moveCalls(tx).find(
        (c) => c.module === "fee_crank" && c.function === "crank_fees",
      );
      assert(
        crank,
        "crank_fees is missing. It is the only non-aborting drain for " +
          "pool.protocol_fees, so omitting it strands them silently",
      );
      assert.deepEqual(
        [...crank.typeArguments],
        [MARKET, COIN_A, COIN_B, quoter, LP, B_A, B_B].map(normalizeStructTag),
        `crank_fees follows pool orientation, not swap direction (xToY=${xToY})`,
      );
    }
  });

  it("mints the input leg and opens a zero coin on the output leg", async () => {
    for (const xToY of [true, false]) {
      const { tx, contract } = build(`${ORACLE}::cpmm::CpQuoter`, xToY);
      await contract.swap(tx);
      const emitted = moveCalls(tx);

      const zero = emitted.find(
        (c) => c.module === "coin" && c.function === "zero",
      );
      assert(zero, "no zero coin for the output leg");
      assert.deepEqual(
        [...zero.typeArguments],
        [normalizeStructTag(xToY ? B_B : B_A)],
        `wrong output leg for xToY=${xToY}`,
      );

      const mints = emitted.filter(
        (c) => c.module === "bank" && c.function.startsWith("mint_"),
      );
      const burns = emitted.filter(
        (c) => c.module === "bank" && c.function.startsWith("burn_"),
      );
      assert.equal(mints.length, 1, "expected exactly one mint");
      assert.equal(burns.length, 2, "expected an output burn and a refund");
      assert.deepEqual(
        [...mints[0].typeArguments],
        [MARKET, xToY ? COIN_A : COIN_B, xToY ? B_A : B_B].map(
          normalizeStructTag,
        ),
      );
    }
  });

  it("keeps each route on the bank api its script used", async () => {
    const cpmm = build(`${ORACLE}::cpmm::CpQuoter`, true);
    await cpmm.contract.swap(cpmm.tx);
    assert(
      moveCalls(cpmm.tx).some((c) => c.function === "mint_btokens"),
      "cpmm came from pool_script, which used the plural bank api",
    );

    const omm = build(`${ORACLE}::omm_v2::OracleQuoterV2`, true);
    await omm.contract.swap(omm.tx);
    assert(
      moveCalls(omm.tx).some((c) => c.function === "mint_btoken"),
      "omm came from pool_script_v2, which used the singular bank api",
    );
  });

  it("puts both price updates ahead of the coins in omm swap arguments", async () => {
    const quoters = {
      omm: `${ORACLE}::omm::OracleQuoter`,
      omm_v2: `${ORACLE}::omm_v2::OracleQuoterV2`,
    };

    for (const [module, quoter] of Object.entries(quoters)) {
      for (const xToY of [true, false]) {
        const { tx, contract } = build(quoter, xToY);
        await contract.swap(tx);

        const commands = tx.getData().commands;
        const swap = moveCalls(tx).find(
          (c) => c.module === module && c.function === "swap",
        );
        assert(swap, `${module}::swap not emitted`);

        const sourceOf = (index: number) => {
          const arg = swap.arguments[index];
          assert(
            arg.$kind === "NestedResult",
            `${module} arg ${index} is ${arg.$kind}, not a command result`,
          );
          const source = commands[arg.NestedResult[0]];
          assert(
            source.$kind === "MoveCall" && source.MoveCall,
            `${module} arg ${index} does not come from a move call`,
          );
          return `${source.MoveCall.module}::${source.MoveCall.function}`;
        };

        assert.deepEqual(
          [sourceOf(4), sourceOf(5)],
          ["oracles::get_pyth_price", "oracles::get_pyth_price"],
          `${module} xToY=${xToY}: the price updates are arguments 4 and 5. ` +
            "@suilend/steamm-sdk codegen emits the coins there instead, so " +
            "aligning with it silently transposes this call",
        );
        assert.deepEqual(
          [sourceOf(6), sourceOf(7)],
          xToY
            ? ["bank::mint_btoken", "coin::zero"]
            : ["coin::zero", "bank::mint_btoken"],
          `${module} xToY=${xToY}: coin_a and coin_b follow pool orientation`,
        );
      }
    }
  });
});

describe("Steamm mainnet route", () => {
  const testAccount =
    "0x02c1d18325782b70819b0a82b975e235acc4309a80bdbe315ab2c805434a1fdd";
  const client = new SuiGrpcClient({
    baseUrl: "https://fullnode.mainnet.sui.io:443",
    network: "mainnet",
  });
  setSuiClient(client);

  const buildSteammSwap = async (sources: SourceDex[]) => {
    const quote = await getQuote({
      tokenIn: SUI_TYPE,
      tokenOut: USDC,
      amountIn: "100000000",
      sources,
      taker: testAccount,
    });
    if (quote.swaps.length === 0) {
      return null;
    }
    const { tx } = await buildTx({
      quoteResponse: quote,
      accountAddress: testAccount,
      commission: { commissionBps: 0, partner: testAccount },
      slippage: 0.02,
      devInspect: true,
    });
    return tx as Transaction;
  };

  it("simulates whichever steamm route the aggregator serves", async () => {
    const tx = await buildSteammSwap([
      "steamm",
      "steamm_oracle_quoter_v2",
      "steamm_oracle_quoter",
    ]);
    if (!tx) {
      console.warn("\x1b[33m%s\x1b[0m", "no steamm route; nothing asserted");
      return;
    }

    const config = await getConfig();
    const script = normalizeSuiAddress(config.steamm.script);
    const calls = moveCalls(tx);

    assert(
      calls.every((call) => normalizeSuiAddress(call.package) !== script),
      "a command still targets steamm_scripts",
    );

    const quoters = calls
      .filter((c) => ["cpmm", "omm", "omm_v2"].includes(c.module))
      .map((c) => c.module);
    console.log(`steamm route exercised: ${quoters.join(",") || "none"}`);

    const simResult = await client.simulateTransaction({
      transaction: tx,
      include: { effects: true, events: true },
    });
    assert(
      simResult.$kind === "Transaction" &&
        simResult.Transaction?.effects?.status.success,
      `Transaction failed: ${
        simResult.$kind === "FailedTransaction"
          ? simResult.FailedTransaction?.effects?.status.error
          : "unknown"
      }`,
    );
    assert(
      simResult.Transaction?.events?.find((e) =>
        e.eventType.endsWith("::settle::Swap"),
      )?.json,
      "Swap event not found",
    );
  });
});
