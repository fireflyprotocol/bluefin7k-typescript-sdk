import { assert } from "chai";
import { getConfig } from "../src/features/swap/config.js";
import { Config } from "../src/types/aggregator.js";

// Minimal Config fixture for tests. The fields the SDK actually exercises in
// these tests are the turbos package + version; everything else is filler so
// the value is structurally a Config. Casting via `as unknown as Config` keeps
// the tests honest without forcing every interface field into the fixture.
const FIXTURE = {
  turbos: {
    name: "Turbos Finance",
    package:
      "0xa5a0c25c79e428eba04fb98b3fb2a34db45ab26d4c8faf0d7e39d66a63891e64",
    version:
      "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f",
  },
} as unknown as Config;

describe("getConfig — configOverride", () => {
  it("returns the override unchanged when no swapViaPartner is provided", async () => {
    const result = await getConfig(undefined, FIXTURE);

    assert.equal(
      result.turbos.package,
      "0xa5a0c25c79e428eba04fb98b3fb2a34db45ab26d4c8faf0d7e39d66a63891e64",
      "override package should be returned",
    );
    assert.equal(
      result.turbos.version,
      "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f",
      "non-overridden fields should be preserved from the override",
    );
  });

  it("attaches swapViaPartner onto the override result", async () => {
    const partner = {
      partnerAddress:
        "0x5c8b49939d90a4dcad665bc3606fde52e54bf27e79e696b87e13512ec5a897b7",
      feePercentage1e6: 1000,
    };

    const result = await getConfig(partner, FIXTURE);

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
      const result = await getConfig(undefined, FIXTURE);
      assert.isObject(result);
      assert.equal(result.turbos.package, FIXTURE.turbos.package);
    } finally {
      SdkConfig.setBaseUrl(original);
    }
  });
});
