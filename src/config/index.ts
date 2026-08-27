import type { ClientWithCoreApi } from "@mysten/sui/client";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { API_ENDPOINTS, DEFAULT_BASE_URL } from "../constants/apiEndpoints.js";
import { ProxyPriceServiceConnection } from "./pythProxy.js";

type EndpointProvider = "Bluefin7k" | "Bluefin7kV2";

const HERMES_API = "https://hermes.pyth.network";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

const HERMES_API_PRO = "https://pyth.dourolabs.app/hermes";
const WORMHOLE_STATE_ID_PRO =
  "0xdbca52b9fb4f712e25f61f974586d93ac541bcf8389564f0323bb07215168b5c";
const PYTH_STATE_ID_PRO =
  "0x03719fae774ddab3cfcaa53bbc046f0cbe21410019b6280811bf3f9f4b05839d";

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

let pythClient: SuiPythClient = new SuiPythClient(
  suiClient,
  PYTH_STATE_ID,
  WORMHOLE_STATE_ID,
);
const DEFAULT_PYTH_CONNECTION = new SuiPriceServiceConnection(HERMES_API);
let pythConnection: SuiPriceServiceConnection = DEFAULT_PYTH_CONNECTION;
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
  // Keep Pyth on the same transport/network as the primary client. Pyth v4
  // reads through `.core`, so any @mysten/sui v2 client works here.
  pythClient.provider = client;
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

function hasPythOptIn(): boolean {
  return pythConnection !== DEFAULT_PYTH_CONNECTION;
}

function usePythPro(
  options: { accessToken: string } | { updateDataUrl: string },
): void {
  pythClient = new SuiPythClient(
    suiClient,
    PYTH_STATE_ID_PRO,
    WORMHOLE_STATE_ID_PRO,
  );
  pythConnection =
    "updateDataUrl" in options
      ? new ProxyPriceServiceConnection(options.updateDataUrl)
      : new SuiPriceServiceConnection(HERMES_API_PRO, {
          accessToken: options.accessToken,
        });
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
  usePythPro,
  setEndpointProvider,
  getEndpointProvider,
  setBaseUrl,
  getBaseUrl,
  resetBaseUrl,
};

export { Config, hasPythOptIn };
export type { EndpointProvider };
