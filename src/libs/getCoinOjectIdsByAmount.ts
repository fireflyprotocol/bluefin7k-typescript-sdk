import type { SuiClientTypes } from "@mysten/sui/client";
import { Config } from "../config/index";

const orderByKey = <T extends object>(
  array: T[],
  key: string,
  sortBy: "desc" | "asc",
) => {
  if (!array?.length) {
    return;
  }
  let swapped: boolean;
  do {
    swapped = false;
    for (let i = 0; i < array.length - 1; i++) {
      const a = BigInt((array[i] as Record<string, unknown>)[key] as string);
      const b = BigInt((array[i + 1] as Record<string, unknown>)[key] as string);
      if (sortBy === "desc" ? a < b : a > b) {
        const temp = array[i];
        array[i] = array[i + 1];
        array[i + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return array;
};

export const getCoinOjectIdsByAmount = async (
  address: string,
  amount: string,
  coinType: string,
): Promise<{
  objectIds: string[];
  objectCoins: SuiClientTypes.Coin[];
  balance: string;
}> => {
  let coinBalances: SuiClientTypes.Coin[] = [];
  let hasNextPage = true;
  let nextCursor: string | null | undefined = undefined;
  while (hasNextPage) {
    try {
      const coins = await Config.getSuiClient().core.listCoins({
        owner: address,
        coinType,
        cursor: nextCursor,
      });
      coinBalances = [...coinBalances, ...coins.objects];
      hasNextPage = coins.hasNextPage;
      nextCursor = coins.cursor;
    } catch (error) {
      console.error("Error fetching data:", error);
      hasNextPage = false;
    }
  }
  // sort coin balance before get object id
  const coinObj =
    orderByKey(
      coinBalances.map((item) => {
        return {
          ...item,
          balance: item.balance,
        };
      }),
      "balance",
      "desc",
    ) ?? [];
  let balance = "0";
  const objectIds: string[] = [];
  const objectCoins: SuiClientTypes.Coin[] = [];
  for (const coin of coinObj) {
    balance = (BigInt(coin.balance) + BigInt(balance)).toString(10);
    objectIds.push(coin.objectId);
    objectCoins.push(coin);
    if (BigInt(balance) >= BigInt(amount)) {
      break;
    }
  }
  return { objectIds, balance, objectCoins };
};
