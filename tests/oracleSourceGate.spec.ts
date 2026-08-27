import "mocha";

import { assert } from "chai";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import { Config } from "../src/config/index.js";
import {
  DEFAULT_SOURCES,
  ORACLE_BASED_SOURCES,
  getQuote,
} from "../src/features/swap/getQuote.js";

const DEFAULT_CONNECTION = Config.getPythConnection();

const SUI = "0x2::sui::SUI";
const USDC =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";

const originalFetch = globalThis.fetch;

const captureSources = (): (() => string[]) => {
  let sent = "";
  globalThis.fetch = ((input: unknown) => {
    sent = new URL(String(input)).searchParams.get("sources") ?? "";
    return Promise.resolve(
      new Response(JSON.stringify({ swaps: [], routes: [] }), { status: 200 }),
    );
  }) as typeof fetch;
  return () => (sent ? sent.split(",") : []);
};

describe("oracle sources require a Pyth opt-in", () => {
  beforeEach(() => {
    Config.setPythConnection(DEFAULT_CONNECTION);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Config.setPythConnection(DEFAULT_CONNECTION);
  });

  it("omits them from the default source list", async () => {
    const sourcesSent = captureSources();

    await getQuote({ tokenIn: SUI, tokenOut: USDC, amountIn: "1000000000" });

    const sent = sourcesSent();
    assert.isNotEmpty(sent);
    for (const oracleSource of ORACLE_BASED_SOURCES) {
      assert.notInclude(sent, oracleSource);
    }
  });

  it("omits them from an explicit list too, spread idiom included", async () => {
    const sourcesSent = captureSources();

    await getQuote({
      tokenIn: SUI,
      tokenOut: USDC,
      amountIn: "1000000000",
      sources: [...DEFAULT_SOURCES],
    });

    for (const oracleSource of ORACLE_BASED_SOURCES) {
      assert.notInclude(sourcesSent(), oracleSource);
    }
  });

  it("keeps every non-oracle source the caller asked for", async () => {
    const sourcesSent = captureSources();

    await getQuote({ tokenIn: SUI, tokenOut: USDC, amountIn: "1000000000" });

    const expected = DEFAULT_SOURCES.filter(
      (s) => !ORACLE_BASED_SOURCES.has(s),
    );
    assert.deepEqual(sourcesSent(), expected);
  });

  it("restores them once a caller supplies its own Pyth connection", async () => {
    Config.setPythConnection(
      new SuiPriceServiceConnection("https://pyth.example.invalid/hermes"),
    );
    const sourcesSent = captureSources();

    await getQuote({ tokenIn: SUI, tokenOut: USDC, amountIn: "1000000000" });

    assert.deepEqual(sourcesSent(), DEFAULT_SOURCES);
  });

  it("restores them for a usePythPro caller", async () => {
    Config.usePythPro({ accessToken: "not-a-real-token" });
    const sourcesSent = captureSources();

    await getQuote({ tokenIn: SUI, tokenOut: USDC, amountIn: "1000000000" });

    assert.deepEqual(sourcesSent(), DEFAULT_SOURCES);
  });

  it("still drops them for a sponsored tx, opt-in or not", async () => {
    Config.usePythPro({ accessToken: "not-a-real-token" });
    const sourcesSent = captureSources();

    await getQuote({
      tokenIn: SUI,
      tokenOut: USDC,
      amountIn: "1000000000",
      isSponsored: true,
    });

    for (const oracleSource of ORACLE_BASED_SOURCES) {
      assert.notInclude(sourcesSent(), oracleSource);
    }
  });
});
