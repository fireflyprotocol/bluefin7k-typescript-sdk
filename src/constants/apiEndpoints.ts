export const API_ENDPOINTS = {
  MAIN: "https://aggregator.api.sui-prod.bluefin.io",
  SEVENK: "https://api.7k.ag",
  LO_DCA: "https://lod-dca.7k.ag",
  PRICES: "https://prices.7k.ag",
  STATISTIC: "https://statistic.7k.ag",
};

export let MAIN_ENDPOINT: "7k" | "Bluefin7k" = "Bluefin7k";

export const setMainEndpoint = (endpoint: "7k" | "Bluefin7k") => {
  MAIN_ENDPOINT = endpoint;
};

export const getMainEndpointUrl = () =>
  MAIN_ENDPOINT === "Bluefin7k" ? API_ENDPOINTS.MAIN : API_ENDPOINTS.SEVENK;
