import type { SuiClientTypes } from "@mysten/sui/client";
import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { Config } from "../config/index";
import { _7K_CONFIG, _7K_PACKAGE_ID, _7K_VAULT } from "../constants/_7k";

export const SuiUtils = {
  mergeCoins(
    coinObjects: Array<string | TransactionArgument>,
    txb: Transaction,
  ): TransactionArgument | undefined {
    if (coinObjects.length == 1) {
      return typeof coinObjects[0] == "string"
        ? txb.object(coinObjects[0])
        : coinObjects[0];
    }
    const firstCoin =
      typeof coinObjects[0] == "string"
        ? txb.object(coinObjects[0])
        : coinObjects[0];
    txb.mergeCoins(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      firstCoin,
      coinObjects
        .slice(1)
        .map((coin) => (typeof coin == "string" ? txb.object(coin) : coin)),
    );
    return firstCoin;
  },

  getCoinValue(
    coinType: string,
    coinObject: string | TransactionArgument,
    txb: Transaction,
  ): TransactionArgument {
    const inputCoinObject =
      typeof coinObject == "string" ? txb.object(coinObject) : coinObject;
    const [value] = txb.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [coinType],
      arguments: [inputCoinObject],
    });
    return value;
  },

  async getAllUserCoins({ address, type }: { type: string; address: string }) {
    let cursor: string | null | undefined = undefined;

    let coins: SuiClientTypes.Coin[] = [];
    let iter = 0;

    do {
      try {
        const res = await Config.getSuiClient().listCoins({
          owner: address,
          coinType: type,
          cursor: cursor,
          limit: 50,
        });
        coins = coins.concat(res.objects);
        cursor = res.cursor;
        if (!res.hasNextPage || iter === 8) {
          cursor = null;
        }
      } catch (error) {
        console.log(error);
        cursor = null;
      }
      iter++;
    } while (cursor !== null);

    return coins;
  },

  zeroBalance(tx: Transaction, coinType: string) {
    return tx.moveCall({
      target: `0x2::balance::zero`,
      typeArguments: [coinType],
      arguments: [],
    })[0];
  },

  zeroCoin(tx: Transaction, coinType: string) {
    return tx.moveCall({
      target: `0x2::coin::zero`,
      typeArguments: [coinType],
      arguments: [],
    })[0];
  },

  coinIntoBalance(
    tx: Transaction,
    coinType: string,
    coinObject: TransactionArgument,
  ) {
    return tx.moveCall({
      target: `0x2::coin::into_balance`,
      typeArguments: [coinType],
      arguments: [coinObject],
    })[0];
  },

  coinFromBalance(
    tx: Transaction,
    coinType: string,
    balance: TransactionArgument,
  ) {
    return tx.moveCall({
      target: `0x2::coin::from_balance`,
      typeArguments: [coinType],
      arguments: [balance],
    })[0];
  },

  balanceDestroyZero(
    tx: Transaction,
    coinType: string,
    balance: TransactionArgument,
  ) {
    tx.moveCall({
      target: `0x2::balance::destroy_zero`,
      typeArguments: [coinType],
      arguments: [balance],
    });
  },
  collectDust(tx: Transaction, coinType: string, coin: TransactionArgument) {
    tx.moveCall({
      target: `${_7K_PACKAGE_ID}::vault::collect_dust`,
      typeArguments: [coinType],
      arguments: [tx.object(_7K_VAULT), tx.object(_7K_CONFIG), coin],
    });
  },

  transferOrDestroyZeroCoin(
    tx: Transaction,
    coinType: string,
    coin: TransactionArgument,
    address: string,
  ) {
    tx.moveCall({
      target: `${_7K_PACKAGE_ID}::utils::transfer_or_destroy`,
      typeArguments: [coinType],
      arguments: [coin, tx.pure.address(address)],
    });
  },
};
