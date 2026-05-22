import { getSplitCoinForTx } from "../../libs/getSplitCoinForTx.js";
import { denormalizeTokenType } from "../../utils/token.js";
import { GLOBAL_CONFIG_ID, LIMIT_ORDER_MODULE_ID } from "./constants.js";

export interface PlaceLimitOrderParams {
  accountAddress: string;
  payCoinType: string;
  targetCoinType: string;
  payCoinAmount: bigint;
  rate: bigint;
  slippage: bigint;
  expireTs: bigint;
}

export async function placeLimitOrder({
  accountAddress,
  payCoinType,
  targetCoinType,
  payCoinAmount,
  rate,
  slippage,
  expireTs,
}: PlaceLimitOrderParams) {
  const { tx, coinData: payCoin } = await getSplitCoinForTx(
    accountAddress,
    [payCoinAmount.toString()],
    denormalizeTokenType(payCoinType),
  );

  tx.moveCall({
    target: `${LIMIT_ORDER_MODULE_ID}::place_limit_order`,
    arguments: [
      tx.object(GLOBAL_CONFIG_ID),
      payCoin,
      tx.pure.u64(rate),
      tx.pure.u64(slippage),
      tx.pure.u64(expireTs),
      tx.object.clock(),
    ],
    typeArguments: [payCoinType, targetCoinType],
  });

  return tx;
}
