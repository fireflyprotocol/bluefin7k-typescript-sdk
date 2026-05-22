import {
  coinWithBalance,
  Transaction,
  TransactionResult,
} from "@mysten/sui/transactions";
import { normalizeStructTag } from "@mysten/sui/utils";
import { SUI_TYPE } from "../constants/tokens.js";

export const getSplitCoinForTx = async (
  account: string,
  _amount: string,
  splits: string[],
  coinType: string,
  inheritTx?: Transaction,
  _inspecTransaction?: boolean,
  isSponsored = false,
): Promise<{
  tx: Transaction;
  coinData: TransactionResult;
}> => {
  const tx = inheritTx ?? new Transaction();
  // coinWithBalance resolves at build time and needs a sender to source coins
  // and address-balance withdrawals (SIP-58).
  tx.setSenderIfNotSet(account);

  const normalizedCoinType = normalizeStructTag(coinType);
  const isSui = normalizedCoinType === normalizeStructTag(SUI_TYPE);
  const totalBalance = splits.reduce((acc, s) => acc + BigInt(s), 0n);

  // Use coinWithBalance instead of manually fetching+merging+splitting Coin<T>
  // objects. This is SIP-58-aware: the @mysten/sui resolver taps the address
  // balance via 0x2::coin::redeem_funds when coin-object balance is short.
  const inputCoin =
    isSui && !isSponsored
      ? coinWithBalance({ balance: totalBalance, useGasCoin: true })
      : coinWithBalance({ balance: totalBalance, type: normalizedCoinType });

  const coinData = tx.splitCoins(
    inputCoin,
    splits.map((amount) => tx.pure.u64(BigInt(amount))),
  );

  // coinWithBalance produces a coin with the exact totalBalance via an
  // internal SplitCoins. Splitting that coin again (above) into the per-route
  // amounts leaves the resolver's slice at balance 0 — but since Coin<T> has
  // no `drop`, it must be explicitly consumed or the PTB fails with
  // UnusedValueWithoutDrop. Destroy the now-zero slice. (For SUI+useGasCoin
  // we still get a regular Coin<SUI> slice back, so this is uniformly safe.)
  tx.moveCall({
    target: "0x2::coin::destroy_zero",
    typeArguments: [normalizedCoinType],
    arguments: [inputCoin],
  });

  return { tx, coinData };
};
