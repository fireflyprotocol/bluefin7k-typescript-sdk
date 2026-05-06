import { fetchClient } from "../../config/fetchClient.js";
import { getMainEndpointUrl } from "../../constants/apiEndpoints.js";
import { Config } from "../../types/aggregator.js";

let config: Config | null = null;
let configTs: number = 0;

export async function getConfig(
  swapViaPartner:
    | {
        partnerAddress: string;
        feePercentage1e6: number;
      }
    | undefined = undefined,
  configOverride?: Config,
) {
  // Caller-supplied config takes precedence over both cache and HTTP fetch.
  // Used by drift-detection bots to dry-run a swap PTB against a candidate
  // package ID without waiting for the aggregator's /config TTL.
  if (configOverride) {
    return { ...configOverride, swapViaPartner };
  }

  const ttl = 60;
  if (config && Date.now() - configTs < ttl * 1000) {
    return config;
  }

  const url = `${getMainEndpointUrl()}/config`;
  let response: Response;
  try {
    response = await fetchClient(url);
  } catch (error) {
    throw new Error(
      `Failed to fetch protocol config from ${url}: ${(error as Error).message}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch protocol config from ${url}: ${response.status} ${response.statusText}`,
    );
  }
  const fetched = (await response.json()) as Config;
  config = { ...fetched, swapViaPartner };
  configTs = Date.now();
  return config;
}
