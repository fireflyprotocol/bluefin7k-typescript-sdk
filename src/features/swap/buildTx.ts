import {
  Transaction,
  TransactionObjectArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { isValidSuiAddress, toBase64, toHex } from "@mysten/sui/utils";
import { Config } from "../../config/index.js";
import { _7K_CONFIG, _7K_PACKAGE_ID, _7K_VAULT } from "../../constants/_7k.js";
import { getSplitCoinForTx } from "../../libs/getSplitCoinForTx.js";
import { groupSwapRoutes } from "../../libs/groupSwapRoutes.js";
import { BluefinXExtra } from "../../libs/protocols/bluefinx/index.js";
import { sponsorBluefinX } from "../../libs/protocols/bluefinx/client.js";
import { BluefinXTx } from "../../libs/protocols/bluefinx/types.js";
import { swapWithRoute } from "../../libs/swapWithRoute.js";
import {
  BuildTxResult,
  ExtraOracle,
  isBluefinXRouting,
  QuoteResponse,
  TxSorSwap,
} from "../../types/aggregator.js";
import { BuildTxParams } from "../../types/tx.js";
import { SuiUtils } from "../../utils/sui.js";
import { denormalizeTokenType } from "../../utils/token.js";
import { getConfig } from "./config.js";
import { ORACLE_BASED_SOURCES } from "./getQuote.js";

// --- Dynamic gas budget constants ---
// The SDK dry run underestimates for complex aggregator PTBs (150+ commands)
// because on-chain state (STEAMM banks, dynamic fields) can shift between
// dry run and execution. We do our own dry run and apply a generous multiplier.
// Sui only charges actual gas consumed — the budget is just a ceiling/hold.
const GAS_BUDGET_SAFETY_MULTIPLIER = 2n;
const MAX_GAS_BUDGET = 500_000_000n; // 0.5 SUI ceiling
const MIN_GAS_BUDGET = 1_000_000n;

export const buildTx = async ({
  quoteResponse,
  accountAddress,
  slippage,
  commission: __commission,
  devInspect,
  extendTx,
  isSponsored,
  swapViaPartner,
  configOverride,
}: BuildTxParams): Promise<BuildTxResult> => {
  const isBluefinX = isBluefinXRouting(quoteResponse);
  const _commission = {
    ...__commission,
    // commission is ignored for bluefinx
    commissionBps: isBluefinX ? 0 : __commission.commissionBps,
  };
  const { tx: _tx, coinIn } = extendTx || {};
  let coinOut: TransactionObjectArgument | undefined;

  if (isBluefinX && devInspect) {
    throw new Error("BluefinX tx is sponsored, skip devInspect");
  }

  if (!accountAddress) {
    throw new Error("Sender address is required");
  }

  if (!quoteResponse.routes) {
    throw new Error("Invalid quote response: 'routes' are required");
  }

  if (!isValidSuiAddress(_commission.partner)) {
    throw new Error("Invalid commission partner address");
  }

  const tx = _tx || new Transaction();

  const routes = groupSwapRoutes(quoteResponse);
  validateRoutes(routes, isSponsored);

  const splits = routes.map((group) => group[0]?.amount ?? "0");

  let coinData: TransactionResult;
  if (coinIn) {
    coinData = tx.splitCoins(coinIn, splits);
    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      quoteResponse.tokenIn,
      coinIn,
      accountAddress,
    );
  } else {
    const { coinData: _data } = await getSplitCoinForTx(
      accountAddress,
      quoteResponse.swapAmountWithDecimal,
      splits,
      denormalizeTokenType(quoteResponse.tokenIn),
      tx,
      devInspect,
      isSponsored || isBluefinX,
    );
    coinData = _data;
  }

  const pythMap = await updatePythPriceFeedsIfAny(tx, quoteResponse);

  const coinObjects: TransactionObjectArgument[] = [];
  const config = await getConfig(swapViaPartner, configOverride);
  await Promise.all(
    routes.map(async (route, index) => {
      const inputCoinObject = coinData[index];
      const coinRes = await swapWithRoute({
        route,
        inputCoinObject,
        currentAccount: accountAddress,
        tx,
        config,
        pythMap,
      });
      if (coinRes) {
        coinObjects.push(coinRes);
      }
    }),
  );
  if (coinObjects.length > 0) {
    const mergeCoin = (
      coinObjects.length > 1
        ? SuiUtils.mergeCoins(coinObjects, tx)
        : coinObjects[0]
    ) as TransactionObjectArgument;

    const returnAmountAfterCommission =
      (BigInt(10000 - _commission.commissionBps) *
        BigInt(quoteResponse.returnAmountWithDecimal)) /
      BigInt(10000);
    const minReceived =
      (BigInt(1e9 - +slippage * 1e9) * BigInt(returnAmountAfterCommission)) /
      BigInt(1e9);

    tx.moveCall({
      target: `${_7K_PACKAGE_ID}::settle::settle`,
      typeArguments: [quoteResponse.tokenIn, quoteResponse.tokenOut],
      arguments: [
        tx.object(_7K_CONFIG),
        tx.object(_7K_VAULT),
        tx.pure.u64(quoteResponse.swapAmountWithDecimal),
        mergeCoin,
        tx.pure.u64(minReceived), // minimum received
        tx.pure.u64(returnAmountAfterCommission), // expected amount out
        tx.pure.option(
          "address",
          isValidSuiAddress(_commission.partner) ? _commission.partner : null,
        ),
        tx.pure.u64(_commission.commissionBps),
        tx.pure.u64(0),
      ],
    });

    if (!extendTx) {
      tx.transferObjects([mergeCoin], tx.pure.address(accountAddress));
    } else {
      coinOut = mergeCoin;
    }
  }

  if (isBluefinX) {
    const extra = quoteResponse.swaps[0].extra as BluefinXExtra;
    if (extra.quoteExpiresAtUtcMillis < Date.now()) {
      throw new Error("Quote expired");
    }
    tx.setSenderIfNotSet(accountAddress);
    const bytes = await tx.build({
      client: Config.getSuiClient(),
      onlyTransactionKind: true,
    });

    const res = await sponsorBluefinX({
      quoteId: extra.quoteId,
      txBytes: toBase64(bytes),
      sender: accountAddress,
    });

    if (!res.success) {
      throw new Error("Sponsor failed");
    }
    return {
      tx: new BluefinXTx(res.quoteId, res.data.txBytes),
      coinOut,
    };
  }

  await estimateAndSetGasBudget(tx, accountAddress);
  return { tx, coinOut };
};

// We size the gas budget ourselves because @mysten/sui's auto-estimator
// was too low for our multi-step swaps and txs were failing on chain.
// We dry-run and double the result for safety. Sui only charges actual
// gas used, so over-budgeting costs the user nothing.
//
// Edge case: a swap that destroys lots of coin objects can get back a
// big storage rebate, making the dry-run's net gas negative. Doubling a
// negative number is still negative, so the budget would fall through
// to the MIN floor — which is too small to actually run the swap. When
// that happens, base the budget on computation cost instead (always
// positive).
export const computeGasBudget = ({
  computationCost,
  netGas,
}: {
  computationCost: bigint;
  netGas: bigint;
}): bigint => {
  let maxGasBudget = MAX_GAS_BUDGET;
  if (netGas > MAX_GAS_BUDGET) {
    maxGasBudget = netGas;
  }
  let budget =
    netGas > 0n
      ? netGas * GAS_BUDGET_SAFETY_MULTIPLIER
      : computationCost * GAS_BUDGET_SAFETY_MULTIPLIER;
  if (budget > maxGasBudget) budget = maxGasBudget;
  if (budget < MIN_GAS_BUDGET) budget = MIN_GAS_BUDGET;
  return budget;
};

const estimateAndSetGasBudget = async (
  tx: Transaction,
  accountAddress: string,
): Promise<void> => {
  const client = Config.getSuiClient();

  try {
    tx.setSenderIfNotSet(accountAddress);
    const txBytes = await tx.build({ client });

    const dryRun = await client.core.simulateTransaction({
      transaction: txBytes,
      include: { effects: true },
    });

    const txResult = dryRun.Transaction ?? dryRun.FailedTransaction;
    if (dryRun.$kind === "Transaction" && txResult?.effects?.status.success) {
      const { computationCost, storageCost, storageRebate } =
        txResult.effects.gasUsed;

      const netGas =
        BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate);

      const budget = computeGasBudget({
        computationCost: BigInt(computationCost),
        netGas,
      });

      console.log(
        `[gas] dry run: ${netGas} MIST (${Number(netGas) / 1e9} SUI)` +
          ` → budget: ${budget} MIST (${Number(budget) / 1e9} SUI)`,
      );

      tx.setGasBudget(budget);
      return;
    }

    console.warn("[gas] dry run reverted:", txResult?.effects?.status.error);
  } catch (err) {
    console.warn("[gas] estimation failed:", err);
  }

  // Fallback: use max budget if dry run fails or reverts
  // tx.setGasBudget(MAX_GAS_BUDGET);
};

const getPythPriceFeeds = (res: QuoteResponse) => {
  const ids: Set<string> = new Set();
  for (const s of res.swaps) {
    for (const o of (s.extra?.oracles || []) as ExtraOracle[]) {
      // FIXME: deprecation price_identifier in the next version
      type LegacyPyth = {
        bytes?: number[];
        price_identifier?: { bytes: number[] };
      };
      const bytes =
        o.Pyth?.bytes || (o.Pyth as LegacyPyth)?.price_identifier?.bytes;
      if (bytes) {
        ids.add("0x" + toHex(Uint8Array.from(bytes)));
      }
    }
  }
  return Array.from(ids);
};

const updatePythPriceFeedsIfAny = async (
  tx: Transaction,
  quoteResponse: QuoteResponse,
) => {
  // update oracles price if any
  const pythMap: Record<string, string> = {};
  const pythIds = getPythPriceFeeds(quoteResponse);
  if (pythIds.length > 0) {
    const prices =
      await Config.getPythConnection().getPriceFeedsUpdateData(pythIds);
    const ids = await Config.getPythClient().updatePriceFeeds(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx as any,
      prices,
      pythIds,
    );
    pythIds.map((id, index) => {
      pythMap[id] = ids[index];
    });
  }
  return pythMap;
};

const validateRoutes = (routes: TxSorSwap[][], isSponsored?: boolean) => {
  if (!isSponsored) {
    return;
  }
  const hasOracleBasedSource = routes.some((g) =>
    g.some((s) => ORACLE_BASED_SOURCES.has(s.pool.type)),
  );
  if (hasOracleBasedSource) {
    throw new Error("Oracle based sources are not supported for sponsored tx");
  }
};
