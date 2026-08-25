import { Buffer } from "buffer";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";

export class ProxyPriceServiceConnection extends SuiPriceServiceConnection {
  private readonly updateDataUrl: string;

  constructor(updateDataUrl: string, config?: { timeout?: number }) {
    super(updateDataUrl, config);
    this.updateDataUrl = updateDataUrl;
  }

  async getPriceFeedsUpdateData(priceIds: string[]): Promise<Buffer[]> {
    if (priceIds.length === 0) return [];

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
