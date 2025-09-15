export * from "./types/aggregator.js";

import { Config } from "./config/index.js";

import { getSuiPrice, getTokenPrice, getTokenPrices } from "./features/prices/index.js";
import { executeBluefinTx } from "./libs/protocols/bluefinx/client.js";

import {
  buildTx,
  estimateGasFee,
  executeTx,
  getQuote,
  getSwapHistory,
  DEFAULT_SOURCES,
} from "./features/swap/index.js";

import {
  cancelDcaOrder,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedDcaOrders,
  getClosedLimitOrders,
  getDcaOrderExecutions,
  getOpenDcaOrders,
  getOpenLimitOrders,
  placeDcaOrder,
  placeLimitOrder,
} from "./features/limitDca/index.js";

// avoid breaking changes
const getSuiClient = Config.getSuiClient;
const setSuiClient = Config.setSuiClient;

export {
  // config
  Config,

  // sui client
  getSuiClient,
  setSuiClient,

  // prices
  getTokenPrice,
  getTokenPrices,
  getSuiPrice,

  // swap
  getQuote,
  estimateGasFee,
  buildTx,
  getSwapHistory,
  executeTx,
  executeBluefinTx,
  DEFAULT_SOURCES,

  // limit order
  placeLimitOrder,
  getOpenLimitOrders,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedLimitOrders,

  // dca
  placeDcaOrder,
  getOpenDcaOrders,
  cancelDcaOrder,
  getClosedDcaOrders,
  getDcaOrderExecutions,
};

export default {
  // config
  Config,

  // sui client
  getSuiClient,
  setSuiClient,

  // prices
  getTokenPrice,
  getTokenPrices,
  getSuiPrice,

  // swap
  getQuote,
  estimateGasFee,
  buildTx,
  getSwapHistory,
  executeTx,
  executeBluefinTx,
  DEFAULT_SOURCES,

  // limit order
  placeLimitOrder,
  getOpenLimitOrders,
  cancelLimitOrder,
  claimExpiredLimitOrder,
  getClosedLimitOrders,

  // dca
  placeDcaOrder,
  getOpenDcaOrders,
  cancelDcaOrder,
  getClosedDcaOrders,
  getDcaOrderExecutions,
};
