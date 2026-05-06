import { assert } from "chai";
import { getConfig } from "../src/features/swap/config.js";
import { Config as SdkConfig } from "../src/config/index.js";

// Regression test for BET-3930. The SDK previously fell back to a hardcoded
// DEFAULT_CONFIG when /config was unreachable, which silently shipped stale
// package IDs to wallets and caused on-chain MoveAbort failures. The contract
// now is: fail loudly, never serve stale data.
describe("getConfig — fetch failures", () => {
  it("throws when the aggregator is unreachable", async () => {
    const original = SdkConfig.getBaseUrl();
    // Unroutable host — connection refused, no DNS in flight.
    SdkConfig.setBaseUrl("http://127.0.0.1:1");

    try {
      let threw = false;
      try {
        // Bypass the in-process 60s cache by passing a unique partner —
        // forces the cache miss branch on a fresh test run.
        await getConfig(undefined, undefined);
      } catch (err) {
        threw = true;
        assert.match(
          (err as Error).message,
          /Failed to fetch protocol config/,
          "error message should identify the source",
        );
      }
      assert.isTrue(threw, "getConfig must throw when /config is unreachable");
    } finally {
      SdkConfig.setBaseUrl(original);
    }
  });
});
