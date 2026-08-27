import "mocha";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { assert } from "chai";
import { Config, setSuiClient } from "../src/index.js";

const SENDER =
  "0x02c1d18325782b70819b0a82b975e235acc4309a80bdbe315ab2c805434a1fdd";
const ORACLES_PRO_COMPATIBLE =
  "0xc99e4b4d2211ec7ade8fd1c54bcabdcc6f782ee77debb27fe03d951bccf83cbd";
const ORACLE_REGISTRY =
  "0x919bba48fddc65e9885433e36ec24278cc80b56bf865f46e9352fa2852d701bc";
const SUI_USD_FEED =
  "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744";
const SUI_USD_ORACLE_INDEX = 0;

const client = new SuiGrpcClient({
  baseUrl: "https://fullnode.mainnet.sui.io:443",
  network: "mainnet",
});

type Outcome = { success: boolean; error: string };

const simulate = async (fn: string): Promise<Outcome> => {
  const tx = new Transaction();
  tx.setSender(SENDER);
  tx.setGasBudget(50_000_000);

  const updates =
    await Config.getPythConnection().getPriceFeedsUpdateData([SUI_USD_FEED]);
  const [priceInfoObject] = await Config.getPythClient().updatePriceFeeds(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx as any,
    updates,
    [SUI_USD_FEED],
  );

  tx.moveCall({
    target: `${ORACLES_PRO_COMPATIBLE}::oracles::${fn}`,
    arguments: [
      tx.object(ORACLE_REGISTRY),
      tx.object(priceInfoObject),
      tx.pure.u64(SUI_USD_ORACLE_INDEX),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  try {
    const bytes = await tx.build({ client });
    const result = await client.core.simulateTransaction({
      transaction: bytes,
      include: { effects: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    const status = (r.Transaction ?? r.FailedTransaction)?.effects?.status;
    return { success: Boolean(status?.success), error: String(status?.error) };
  } catch (err) {
    return { success: false, error: String((err as Error).message) };
  }
};

describe("steamm oracle path against the upgraded Pyth deployment", function () {
  before(function () {
    if (!process.env.PYTH_KEY) {
      this.skip();
    }
    setSuiClient(client);
    Config.usePythPro({ accessToken: process.env.PYTH_KEY as string });
  });

  it("accepts an upgraded PriceInfoObject on the pro-compatible getter", async () => {
    const { success, error } = await simulate(
      "get_pyth_price_pro_compatible",
    );
    assert.isTrue(success, `expected a clean simulation, got: ${error}`);
  });

  it("rejects the same object on the legacy getter", async () => {
    const { success, error } = await simulate("get_pyth_price");
    assert.isFalse(success, "legacy getter unexpectedly accepted it");
    assert.match(error, /TypeMismatch/);
  });
});
