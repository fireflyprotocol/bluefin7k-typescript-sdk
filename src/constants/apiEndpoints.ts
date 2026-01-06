import { Config } from "../config";

export const API_ENDPOINTS = {
  MAIN: "https://aggregator.api.sui-prod.bluefin.io",
  SEVENK: "https://api.7k.ag",
  LO_DCA: "https://lod-dca.7k.ag",
  STATISTIC: "https://statistic.7k.ag",
};

export const getMainEndpointUrl = () =>
  Config.getEndpointProvider() === "Bluefin7k"
    ? API_ENDPOINTS.MAIN
    : API_ENDPOINTS.SEVENK;
