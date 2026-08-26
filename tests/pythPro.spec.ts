import "mocha";

import { assert } from "chai";
import { Config } from "../src/config/index.js";
import { ProxyPriceServiceConnection } from "../src/config/pythProxy.js";

const PYTH_STATE_ID_PRO =
  "0x03719fae774ddab3cfcaa53bbc046f0cbe21410019b6280811bf3f9f4b05839d";
const WORMHOLE_STATE_ID_PRO =
  "0xdbca52b9fb4f712e25f61f974586d93ac541bcf8389564f0323bb07215168b5c";
const PYTH_STATE_ID_LEGACY =
  "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";

const stateIdsOf = (client: unknown): string[] =>
  Object.values(client as Record<string, unknown>).filter(
    (v): v is string => typeof v === "string" && v.startsWith("0x"),
  );

const originalFetch = globalThis.fetch;
const stubFetch = (impl: (url: string) => Response) => {
  globalThis.fetch = ((input: unknown) =>
    Promise.resolve(impl(String(input)))) as typeof fetch;
};

describe("usePythPro", () => {
  it("leaves the default on the legacy state", () => {
    assert.include(stateIdsOf(Config.getPythClient()), PYTH_STATE_ID_LEGACY);
  });

  it("moves the state ids and the connection together, for a browser", () => {
    Config.usePythPro({ updateDataUrl: "https://api.example.invalid/updates" });

    const ids = stateIdsOf(Config.getPythClient());
    assert.include(ids, PYTH_STATE_ID_PRO);
    assert.include(ids, WORMHOLE_STATE_ID_PRO);
    assert.notInclude(ids, PYTH_STATE_ID_LEGACY);
    assert.instanceOf(Config.getPythConnection(), ProxyPriceServiceConnection);
  });

  it("moves the same state ids for a server, without the proxy", () => {
    Config.usePythPro({ accessToken: "not-a-real-token" });

    const ids = stateIdsOf(Config.getPythClient());
    assert.include(ids, PYTH_STATE_ID_PRO);
    assert.include(ids, WORMHOLE_STATE_ID_PRO);
    assert.notInstanceOf(
      Config.getPythConnection(),
      ProxyPriceServiceConnection,
    );
  });
});

describe("ProxyPriceServiceConnection", () => {
  const url = "https://api.example.invalid/updates";

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("asks for deduped, sorted, bare, lower-case ids", async () => {
    let seen = "";
    stubFetch((input) => {
      seen = input;
      return new Response(JSON.stringify({ updateData: [] }), { status: 200 });
    });

    await new ProxyPriceServiceConnection(url).getPriceFeedsUpdateData([
      "0xBB11",
      "aa22",
      "bb11",
    ]);

    assert.equal(seen, `${url}?ids=aa22,bb11`);
  });

  it("decodes the base64 chunks it is handed", async () => {
    const payload = Buffer.from("update-blob").toString("base64");
    stubFetch(
      () =>
        new Response(JSON.stringify({ updateData: [payload] }), {
          status: 200,
        }),
    );

    const [chunk] = await new ProxyPriceServiceConnection(
      url,
    ).getPriceFeedsUpdateData(["aa22"]);
    assert.equal(chunk.toString(), "update-blob");
  });

  it("fails loudly rather than returning an empty update", async () => {
    stubFetch(
      () => new Response("Price IDs not found: aa22", { status: 503 }),
    );

    try {
      await new ProxyPriceServiceConnection(url).getPriceFeedsUpdateData([
        "aa22",
      ]);
      assert.fail("expected a throw on a non-ok response");
    } catch (err) {
      assert.match((err as Error).message, /answered 503/);
    }
  });

  it("skips the request entirely when there are no feeds", async () => {
    let called = false;
    stubFetch(() => {
      called = true;
      return new Response("{}", { status: 200 });
    });

    assert.deepEqual(
      await new ProxyPriceServiceConnection(url).getPriceFeedsUpdateData([]),
      [],
    );
    assert.isFalse(called);
  });
});
