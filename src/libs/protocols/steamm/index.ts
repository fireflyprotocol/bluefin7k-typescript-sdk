import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import {
  normalizeStructTag,
  parseStructTag,
  SUI_CLOCK_OBJECT_ID,
} from "@mysten/sui/utils";
import { ExtraOracle } from "../../../types/aggregator.js";
import { SuiUtils } from "../../../utils/sui.js";
import { BaseContract } from "../base.js";

export type SteamExtra = {
  bankAStructTag: string;
  bankBStructTag: string;
  poolStructTag: string;
  bankA: string;
  bankB: string;
  lendingMarketA: string;
  lendingMarketB: string;
  oracleRegistry?: string;
  oracles: ExtraOracle[];
  oracleIndexes?: number[];
};

type SteammTypes = {
  lendingMarket: string;
  coinTypeA: string;
  coinTypeB: string;
  bTokenA: string;
  bTokenB: string;
  quoter: string;
  lp: string;
};

type BankApi = "singular" | "plural";

export class SteammContract extends BaseContract<SteamExtra> {
  async swap(tx: Transaction) {
    if (this.extra.poolStructTag.includes("omm::OracleQuoter")) {
      return this.ommSwap(tx, "v1");
    } else if (this.extra.poolStructTag.includes("omm_v2::OracleQuoterV2")) {
      return this.ommSwap(tx, "v2");
    } else if (this.extra.poolStructTag.includes("cpmm::CpQuoter")) {
      return this.cpmmSwap(tx);
    }
    throw new Error(`Unsupported pool type: ${this.extra.poolStructTag}`);
  }

  cpmmSwap(tx: Transaction) {
    const types = this.resolveTypes();

    return this.swapThroughBanks(tx, types, "plural", (a, b, amountIn) => {
      tx.moveCall({
        target: `${this.config.steamm.package}::cpmm::swap`,
        typeArguments: [types.bTokenA, types.bTokenB, types.lp],
        arguments: [
          tx.object(this.swapInfo.poolId),
          a,
          b,
          tx.pure.bool(this.swapInfo.swapXtoY),
          amountIn,
          tx.pure.u64(0),
        ],
      });
    });
  }

  ommSwap(tx: Transaction, version: "v1" | "v2") {
    const types = this.resolveTypes();
    const [priceA, priceB] = this.getOraclePriceUpdate(tx);

    return this.swapThroughBanks(tx, types, "singular", (a, b, amountIn) => {
      tx.moveCall({
        target: `${this.config.steamm.package}::${
          version === "v1" ? "omm" : "omm_v2"
        }::swap`,
        typeArguments: [
          types.lendingMarket,
          types.coinTypeA,
          types.coinTypeB,
          types.bTokenA,
          types.bTokenB,
          types.lp,
        ],
        arguments: [
          tx.object(this.swapInfo.poolId),
          tx.object(this.extra.bankA),
          tx.object(this.extra.bankB),
          tx.object(this.extra.lendingMarketA),
          priceA,
          priceB,
          a,
          b,
          tx.pure.bool(this.swapInfo.swapXtoY),
          amountIn,
          tx.pure.u64(0),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
    });
  }

  private swapThroughBanks(
    tx: Transaction,
    types: SteammTypes,
    bankApi: BankApi,
    poolSwap: (
      coinA: TransactionObjectArgument,
      coinB: TransactionObjectArgument,
      amountIn: ReturnType<typeof SuiUtils.getCoinValue>,
    ) => void,
  ): TransactionObjectArgument {
    const extra = this.extra;
    const xToY = this.swapInfo.swapXtoY;
    const steamm = this.config.steamm.package;
    const mint = bankApi === "plural" ? "mint_btokens" : "mint_btoken";
    const burn = bankApi === "plural" ? "burn_btokens" : "burn_btoken";

    const bankIn = xToY ? extra.bankA : extra.bankB;
    const bankOut = xToY ? extra.bankB : extra.bankA;
    const bTokenInType = xToY ? types.bTokenA : types.bTokenB;
    const bTokenOutType = xToY ? types.bTokenB : types.bTokenA;
    const coinInType = xToY ? types.coinTypeA : types.coinTypeB;
    const coinOutType = xToY ? types.coinTypeB : types.coinTypeA;

    const bankInTypes = [types.lendingMarket, coinInType, bTokenInType];
    const bankOutTypes = [types.lendingMarket, coinOutType, bTokenOutType];

    const bTokenIn = tx.moveCall({
      target: `${steamm}::bank::${mint}`,
      typeArguments: bankInTypes,
      arguments: [
        tx.object(bankIn),
        tx.object(extra.lendingMarketA),
        this.inputCoinObject,
        this.getInputCoinValue(tx),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    })[0];
    const bTokenOut = SuiUtils.zeroCoin(tx, bTokenOutType);

    poolSwap(
      xToY ? bTokenIn : bTokenOut,
      xToY ? bTokenOut : bTokenIn,
      SuiUtils.getCoinValue(bTokenInType, bTokenIn, tx),
    );

    const redeemed = tx.moveCall({
      target: `${steamm}::bank::${burn}`,
      typeArguments: bankOutTypes,
      arguments: [
        tx.object(bankOut),
        tx.object(extra.lendingMarketA),
        bTokenOut,
        SuiUtils.getCoinValue(bTokenOutType, bTokenOut, tx),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    })[0];

    const refunded = tx.moveCall({
      target: `${steamm}::bank::${burn}`,
      typeArguments: bankInTypes,
      arguments: [
        tx.object(bankIn),
        tx.object(extra.lendingMarketA),
        bTokenIn,
        SuiUtils.getCoinValue(bTokenInType, bTokenIn, tx),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    })[0];
    tx.mergeCoins(this.inputCoinObject, [refunded]);

    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      bTokenInType,
      bTokenIn,
      this.currentAccount,
    );
    SuiUtils.transferOrDestroyZeroCoin(
      tx,
      bTokenOutType,
      bTokenOut,
      this.currentAccount,
    );

    tx.moveCall({
      target: `${steamm}::fee_crank::crank_fees`,
      typeArguments: [
        types.lendingMarket,
        types.coinTypeA,
        types.coinTypeB,
        types.quoter,
        types.lp,
        types.bTokenA,
        types.bTokenB,
      ],
      arguments: [
        tx.object(this.swapInfo.poolId),
        tx.object(extra.bankA),
        tx.object(extra.bankB),
      ],
    });

    SuiUtils.collectDust(tx, this.swapInfo.assetIn, this.inputCoinObject);
    return redeemed;
  }

  private resolveTypes(): SteammTypes {
    const extra = this.extra;
    if (
      !extra ||
      !extra.bankAStructTag ||
      !extra.bankBStructTag ||
      !extra.poolStructTag ||
      !extra.bankA ||
      !extra.bankB ||
      !extra.lendingMarketA ||
      !extra.lendingMarketB
    ) {
      throw new Error(`Invalid extra info for steamm swap`);
    }

    if (extra.lendingMarketA !== extra.lendingMarketB) {
      throw new Error(`Invalid lending market for steamm swap`);
    }

    const [bTokenA, bTokenB, quoter, lp] = parseStructTag(
      extra.poolStructTag,
    ).typeParams;
    const [lendingMarket, coinTypeA] = parseStructTag(
      extra.bankAStructTag,
    ).typeParams;
    const [, coinTypeB] = parseStructTag(extra.bankBStructTag).typeParams;

    return {
      lendingMarket: normalizeStructTag(lendingMarket),
      coinTypeA: normalizeStructTag(coinTypeA),
      coinTypeB: normalizeStructTag(coinTypeB),
      bTokenA: normalizeStructTag(bTokenA),
      bTokenB: normalizeStructTag(bTokenB),
      quoter: normalizeStructTag(quoter),
      lp: normalizeStructTag(lp),
    };
  }

  getOraclePriceUpdate(tx: Transaction) {
    const oracleA = this.getPythPriceInfoId(this.extra.oracles?.[0]);
    const oracleB = this.getPythPriceInfoId(this.extra.oracles?.[1]);
    const registry = this.extra.oracleRegistry;
    const indexes = this.extra.oracleIndexes;
    if (!registry || indexes?.length !== 2) {
      throw new Error(`Invalid oracle info for getOraclePriceUpdate`);
    }

    const [a] = tx.moveCall({
      target: `${this.config.steamm.oracle}::oracles::get_pyth_price_pro_compatible`,
      arguments: [
        tx.object(registry),
        tx.object(oracleA),
        tx.pure.u64(indexes[0]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [b] = tx.moveCall({
      target: `${this.config.steamm.oracle}::oracles::get_pyth_price_pro_compatible`,
      arguments: [
        tx.object(registry),
        tx.object(oracleB),
        tx.pure.u64(indexes[1]),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return [a, b] as const;
  }
}
