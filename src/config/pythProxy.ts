import { Buffer } from "buffer";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";

/**
 * Fetches on-chain price update data from a caller-supplied endpoint instead of
 * from Hermes directly.
 *
 * Pyth Pro authenticates with a bearer token, and a browser cannot hold one. So
 * a page that needs Pro-signed VAAs asks a server that can, and that server
 * asks Pyth. Only `getPriceFeedsUpdateData` is overridden -- every other method
 * keeps whatever the base URL provides, which is why the constructor still
 * passes it up.
 */
export class ProxyPriceServiceConnection extends SuiPriceServiceConnection {
  private readonly updateDataUrl: string;

  constructor(updateDataUrl: string, config?: { timeout?: number }) {
    super(updateDataUrl, config);
    this.updateDataUrl = updateDataUrl;
  }

  async getPriceFeedsUpdateData(priceIds: string[]): Promise<Buffer[]> {
    if (priceIds.length === 0) return [];

    // Deduped, sorted, bare and lower-cased, so two callers asking for the same
    // feeds in a different order or casing produce one query string and share
    // an edge cache entry. Safe to dedupe because the response is accumulator
    // chunks for the set, not one entry per requested id.
    const ids = [
      ...new Set(priceIds.map((id) => id.replace(/^0x/i, "").toLowerCase())),
    ].sort();

    const response = await fetch(`${this.updateDataUrl}?ids=${ids.join(",")}`);

    if (!response.ok) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(
        `price update data endpoint answered ${String(response.status)} for ` +
          `${String(ids.length)} feed(s): ${detail.slice(0, 200)}`,
      );
    }

    const body = (await response.json()) as { updateData?: unknown };
    const chunks = body.updateData;
    if (
      !Array.isArray(chunks) ||
      chunks.some((chunk) => typeof chunk !== "string")
    ) {
      throw new Error(
        "price update data endpoint returned no updateData array; got " +
          JSON.stringify(body).slice(0, 200),
      );
    }

    return (chunks as string[]).map((chunk) => Buffer.from(chunk, "base64"));
  }
}
