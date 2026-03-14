export const DEFAULT_BASE_URL = "https://aggregator.api.sui-prod.bluefin.io";

export const API_ENDPOINTS = {
  MAIN: DEFAULT_BASE_URL,
  LO_DCA: "https://lod-dca.7k.ag",
  STATISTIC: "https://statistic.7k.ag",
};

export const getMainEndpointUrl = () => API_ENDPOINTS.MAIN;
