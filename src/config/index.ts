import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { API_ENDPOINTS, DEFAULT_BASE_URL } from "../constants/apiEndpoints";

type EndpointProvider = "Bluefin7k" | "Bluefin7kV2";

const HERMES_API = "https://hermes.pyth.network";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

let apiKey: string = "";
let bluefinXApiKey: string = "";
let bluefinAggregatorApiKey: string = "";
let suiClient: SuiGrpcClient = new SuiGrpcClient({
  baseUrl: "https://fullnode.mainnet.sui.io:443",
  network: "mainnet",
});
let pythClient: SuiPythClient = new SuiPythClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suiClient as any,
  PYTH_STATE_ID,
  WORMHOLE_STATE_ID,
);
let pythConnection: SuiPriceServiceConnection = new SuiPriceServiceConnection(
  HERMES_API,
);
let endpointProvider: EndpointProvider = "Bluefin7kV2";

function setApiKey(key: string): void {
  apiKey = key;
}

function getApiKey(): string {
  return apiKey;
}

function setBluefinXApiKey(key: string): void {
  bluefinXApiKey = key;
}

function getBluefinXApiKey(): string {
  return bluefinXApiKey;
}

function setBluefinAggregatorApiKey(key: string): void {
  bluefinAggregatorApiKey = key;
}

function getBluefinAggregatorApiKey(): string {
  return bluefinAggregatorApiKey;
}

function getSuiClient(): SuiGrpcClient {
  return suiClient;
}

function setSuiClient(client: SuiGrpcClient): void {
  suiClient = client;
}

function setPythClient(client: SuiPythClient): void {
  pythClient = client;
}

function getPythClient(): SuiPythClient {
  return pythClient;
}

function setPythConnection(connection: SuiPriceServiceConnection): void {
  pythConnection = connection;
}

function getPythConnection(): SuiPriceServiceConnection {
  return pythConnection;
}

function setEndpointProvider(provider: EndpointProvider): void {
  endpointProvider = provider;
}

function getEndpointProvider(): EndpointProvider {
  return endpointProvider;
}

/**
 * Override the base URL for all aggregator API calls (quotes, config, etc.).
 * Use this to point the SDK at an internal or alternative endpoint.
 *
 * @example Config.setBaseUrl("https://aggregator.api.sui-prod.int.bluefin.io")
 */
function setBaseUrl(url: string): void {
  API_ENDPOINTS.MAIN = url;
}

/**
 * Get the current base URL used for aggregator API calls.
 */
function getBaseUrl(): string {
  return API_ENDPOINTS.MAIN;
}

/**
 * Reset the base URL to the default public endpoint.
 */
function resetBaseUrl(): void {
  API_ENDPOINTS.MAIN = DEFAULT_BASE_URL;
}

const Config = {
  setApiKey,
  getApiKey,
  setBluefinXApiKey,
  getBluefinXApiKey,
  setBluefinAggregatorApiKey,
  getBluefinAggregatorApiKey,
  setSuiClient,
  getSuiClient,
  setPythClient,
  getPythClient,
  setPythConnection,
  getPythConnection,
  setEndpointProvider,
  getEndpointProvider,
  setBaseUrl,
  getBaseUrl,
  resetBaseUrl,
};

export { Config };
export type { EndpointProvider };
