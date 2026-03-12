import { SuiGrpcClient } from "@mysten/sui/grpc";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";

type EndpointProvider = "Bluefin7k" | "Bluefin7kV2";

const HERMES_API = "https://hermes.pyth.network";
const WORMHOLE_STATE_ID =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const PYTH_STATE_ID =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

let apiKey: string = "";
let bluefinXApiKey: string = "";
let bluefinAggregatorApiKey: string = "";

/** gRPC client — used for all on-chain reads and transaction simulation/execution */
let suiClient: SuiGrpcClient = new SuiGrpcClient({
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

function getSuiClient(): SuiGrpcClient {
  return suiClient;
}

function setSuiClient(client: SuiGrpcClient): void {
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
};

export { Config };
export type { EndpointProvider };
