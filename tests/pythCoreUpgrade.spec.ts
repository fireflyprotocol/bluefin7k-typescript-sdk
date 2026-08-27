import "mocha";

import { assert } from "chai";
import { Config } from "../src/config/index.js";
import {
  getQuote,
  ORACLE_BASED_SOURCES,
} from "../src/features/swap/getQuote.js";

const PYTH_STATE_ID_UPGRADED =
  "0x03719fae774ddab3cfcaa53bbc046f0cbe21410019b6280811bf3f9f4b05839d";
const WORMHOLE_STATE_ID_UPGRADED =
  "0xdbca52b9fb4f712e25f61f974586d93ac541bcf8389564f0323bb07215168b5c";
const PYTH_STATE_ID_PRE_UPGRADE =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";
const WORMHOLE_STATE_ID_PRE_UPGRADE =
  "0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c";
const HERMES_UPGRADED = "https://pyth.dourolabs.app/hermes";

const stringsIn = (o: unknown): string[] =>
  Object.values(o as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string",
  );

describe("default Pyth deployment is the upgraded Pyth Core", () => {
  it("pins the upgraded Sui state ids, not the pre-upgrade ones", () => {
    const ids = stringsIn(Config.getPythClient());

    assert.include(ids, PYTH_STATE_ID_UPGRADED);
    assert.include(ids, WORMHOLE_STATE_ID_UPGRADED);
    assert.notInclude(ids, PYTH_STATE_ID_PRE_UPGRADE);
    assert.notInclude(ids, WORMHOLE_STATE_ID_PRE_UPGRADE);
  });

  it("points the default connection at the upgraded endpoint", () => {
    const endpoints = stringsIn(Config.getPythConnection()).filter((v) =>
      v.startsWith("http"),
    );

    assert.isNotEmpty(endpoints, "expected an endpoint on the connection");
    assert.include(endpoints, HERMES_UPGRADED);
    assert.notInclude(endpoints, "https://hermes.pyth.network");
  });

  it("still requires an opt-in, because the upgraded endpoint needs a key", async () => {
    const originalFetch = globalThis.fetch;
    let sent = "";
    globalThis.fetch = ((input: unknown) => {
      sent = new URL(String(input)).searchParams.get("sources") ?? "";
      return Promise.resolve(
        new Response(JSON.stringify({ swaps: [], routes: [] }), {
          status: 200,
        }),
      );
    }) as typeof fetch;

    try {
      await getQuote({
        tokenIn: "0x2::sui::SUI",
        tokenOut:
          "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        amountIn: "1000000000",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    for (const oracleSource of ORACLE_BASED_SOURCES) {
      assert.notInclude(sent.split(","), oracleSource);
    }
  });
});
