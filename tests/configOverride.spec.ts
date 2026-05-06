import { assert } from "chai";
import { getConfig, DEFAULT_CONFIG } from "../src/features/swap/config.js";
import { Config } from "../src/types/aggregator.js";

describe("getConfig — configOverride", () => {
  it("returns the override unchanged when no swapViaPartner is provided", async () => {
    const candidate: Config = {
      ...DEFAULT_CONFIG,
      turbos: {
        ...DEFAULT_CONFIG.turbos,
        package:
          "0xa5a0c25c79e428eba04fb98b3fb2a34db45ab26d4c8faf0d7e39d66a63891e64",
      },
    };

    const result = await getConfig(undefined, candidate);

    assert.equal(
      result.turbos.package,
      "0xa5a0c25c79e428eba04fb98b3fb2a34db45ab26d4c8faf0d7e39d66a63891e64",
      "override package should be returned",
    );
    assert.equal(
      result.turbos.version,
      DEFAULT_CONFIG.turbos.version,
      "non-overridden fields should be preserved from the override",
    );
  });

  it("attaches swapViaPartner onto the override result", async () => {
    const partner = {
      partnerAddress:
        "0x5c8b49939d90a4dcad665bc3606fde52e54bf27e79e696b87e13512ec5a897b7",
      feePercentage1e6: 1000,
    };

    const result = await getConfig(partner, DEFAULT_CONFIG);

    assert.deepEqual(
      result.swapViaPartner,
      partner,
      "swapViaPartner should be attached to the override result",
    );
  });

  it("does not hit the aggregator when configOverride is provided", async () => {
    // If override is honored, fetchClient is never called. Simulate aggregator
    // unavailability by pointing baseUrl at an unroutable host — call must
    // still succeed because no HTTP is attempted.
    const { Config: SdkConfig } = await import("../src/config/index.js");
    const original = SdkConfig.getBaseUrl();
    SdkConfig.setBaseUrl("http://127.0.0.1:1");

    try {
      const result = await getConfig(undefined, DEFAULT_CONFIG);
      assert.isObject(result);
      assert.equal(result.turbos.package, DEFAULT_CONFIG.turbos.package);
    } finally {
      SdkConfig.setBaseUrl(original);
    }
  });
});
