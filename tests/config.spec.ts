import { assert } from "chai";
import { Config } from "../src/config/index.js";
import {
  API_ENDPOINTS,
  DEFAULT_BASE_URL,
  getMainEndpointUrl,
} from "../src/constants/apiEndpoints.js";

describe("Config.setBaseUrl / getBaseUrl / resetBaseUrl", () => {
  afterEach(() => {
    Config.resetBaseUrl();
  });

  it("should return the default URL initially", () => {
    assert.equal(Config.getBaseUrl(), DEFAULT_BASE_URL);
    assert.equal(
      Config.getBaseUrl(),
      "https://aggregator.api.sui-prod.bluefin.io",
    );
  });

  it("should override the base URL", () => {
    const internalUrl = "https://aggregator.api.sui-prod.int.bluefin.io";
    Config.setBaseUrl(internalUrl);
    assert.equal(Config.getBaseUrl(), internalUrl);
  });

  it("should affect getMainEndpointUrl()", () => {
    const customUrl = "https://custom-aggregator.example.com";
    Config.setBaseUrl(customUrl);
    assert.equal(getMainEndpointUrl(), customUrl);
  });

  it("should affect the API_ENDPOINTS.MAIN singleton", () => {
    const customUrl = "https://internal.bluefin.io";
    Config.setBaseUrl(customUrl);
    assert.equal(API_ENDPOINTS.MAIN, customUrl);
  });

  it("should reset to default URL", () => {
    Config.setBaseUrl("https://something-else.com");
    assert.notEqual(Config.getBaseUrl(), DEFAULT_BASE_URL);

    Config.resetBaseUrl();
    assert.equal(Config.getBaseUrl(), DEFAULT_BASE_URL);
  });

  it("should not affect other endpoints", () => {
    const originalLoDca = API_ENDPOINTS.LO_DCA;
    const originalStatistic = API_ENDPOINTS.STATISTIC;

    Config.setBaseUrl("https://custom.url");

    assert.equal(API_ENDPOINTS.LO_DCA, originalLoDca);
    assert.equal(API_ENDPOINTS.STATISTIC, originalStatistic);
  });
});
