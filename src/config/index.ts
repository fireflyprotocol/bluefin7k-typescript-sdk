import type { ClientWithCoreApi } from "@mysten/sui/client";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { API_ENDPOINTS, DEFAULT_BASE_URL } from "../constants/apiEndpoints.js";

type EndpointProvider = "Bluefin7k" | "Bluefin7kV2";

const HERMES_API = "https://hermes.pyth.network";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

let apiKey: string = "";
let bluefinXApiKey: string = "";
let bluefinAggregatorApiKey: string = "";

/**
 * Primary Sui client (supports JSON-RPC, GraphQL, or gRPC).
 * Default is gRPC for better performance and full feature support.
 * Can be swapped to any ClientWithCoreApi implementation via setSuiClient().
 */
let suiClient: ClientWithCoreApi = new SuiGrpcClient({
  baseUrl: "https://fullnode.mainnet.sui.io:443",
  network: "mainnet",
});

/**
 * JSON-RPC client — required by SuiPythClient (@pythnetwork/pyth-sui-js).
 * The Pyth SDK has not yet migrated to the new gRPC client, so a separate
 * JSON-RPC client is maintained exclusively for Pyth price feed operations.
 */
let jsonRpcClient: SuiJsonRpcClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl("mainnet"),
  network: "mainnet",
});

let pythClient: SuiPythClient = new SuiPythClient(
  jsonRpcClient,
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

function getSuiClient(): ClientWithCoreApi {
  return suiClient;
}

function setSuiClient(client: ClientWithCoreApi): void {
  suiClient = client;
}

function getJsonRpcClient(): SuiJsonRpcClient {
  return jsonRpcClient;
}

function setJsonRpcClient(client: SuiJsonRpcClient): void {
  jsonRpcClient = client;
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
  setJsonRpcClient,
  getJsonRpcClient,
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
