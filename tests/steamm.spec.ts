import "mocha";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { assert } from "chai";
import { SUI_TYPE } from "../src/constants/tokens.js";
import { getConfig } from "../src/features/swap/config.js";
import { buildTx, getQuote, setSuiClient, SourceDex } from "../src/index.js";

const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

describe("Steamm test", () => {
  const testAccount =
    "0x02c1d18325782b70819b0a82b975e235acc4309a80bdbe315ab2c805434a1fdd";
  const amountIn = "100000000"; // 0.1 SUI
  const client = new SuiGrpcClient({
    baseUrl: "https://fullnode.mainnet.sui.io:443",
    network: "mainnet",
  });
  setSuiClient(client);

  const moveCalls = (tx: Transaction) =>
    tx
      .getData()
      .commands.flatMap((command) =>
        command.$kind === "MoveCall" && command.MoveCall
          ? [command.MoveCall]
          : [],
      );

  const buildSteammSwap = async (sources: SourceDex[]) => {
    const quote = await getQuote({
      tokenIn: SUI_TYPE,
      tokenOut: USDC,
      amountIn,
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

  it("routes through steamm itself, never through steamm_scripts", async () => {
    const tx = await buildSteammSwap(["steamm_oracle_quoter_v2", "steamm"]);
    if (!tx) {
      console.warn("\x1b[33m%s\x1b[0m", "no steamm route; nothing asserted");
      return;
    }

    const config = await getConfig();
    const script = normalizeSuiAddress(config.steamm.script);
    const steamm = normalizeSuiAddress(config.steamm.package);
    const calls = moveCalls(tx);

    assert(
      calls.every((call) => normalizeSuiAddress(call.package) !== script),
      "a command still targets steamm_scripts, so the route keeps that " +
        "package's frozen linkage",
    );

    const steammCalls = calls.filter(
      (call) => normalizeSuiAddress(call.package) === steamm,
    );
    assert(
      steammCalls.some((call) => call.module === "bank"),
      "no bank call: the bToken round trip the script used to do is missing",
    );
    assert(
      steammCalls.some(
        (call) => call.module === "fee_crank" && call.function === "crank_fees",
      ),
      "crank_fees is missing. It is the only non-aborting drain for " +
        "pool.protocol_fees, and the scripts cranked on every swap, so " +
        "omitting it strands protocol fees silently",
    );
  });

  it("simulates a steamm swap on mainnet", async () => {
    const tx = await buildSteammSwap(["steamm_oracle_quoter_v2", "steamm"]);
    if (!tx) {
      console.warn("\x1b[33m%s\x1b[0m", "no steamm route; nothing asserted");
      return;
    }

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

    const swapEvent = simResult.Transaction?.events?.find((e) =>
      e.eventType.endsWith("::settle::Swap"),
    )?.json;
    assert(swapEvent, "Swap event not found");
  });
});
