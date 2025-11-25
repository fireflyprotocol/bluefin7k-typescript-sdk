import { API_ENDPOINTS } from "../constants/apiEndpoints";
import { Config } from "./index";

export async function fetchClient(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const apiKey = (Config.getApiKey() || "").trim();
  const bluefinXApiKey = (Config.getBluefinXApiKey() || "").trim();
  const bluefinAggregatorApiKey = (Config.getBluefinAggregatorApiKey() || "").trim();
  if (apiKey) {
    headers.set("apiKey", apiKey);
  }

  if (bluefinXApiKey) {
    headers.set("Bluefin-X-API-Key", bluefinXApiKey);
  }

  if (bluefinAggregatorApiKey && input.includes(API_ENDPOINTS.MAIN)) {
    headers.set("Bluefin-Aggregator-API-Key", bluefinAggregatorApiKey);
  }

  const modifiedInit: RequestInit = {
    ...init,
    headers,
  };

  return fetch(input, modifiedInit);
}
