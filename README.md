# Bluefin7k Aggregator TypeScript SDK

## Installation

```bash
npm i @bluefin-exchange/bluefin7k-aggregator-sdk
```

This package requires `@pythnetwork/pyth-sui-js` as a peer dependency. If your
project does not have it, you need to install it.

```bash
npm i @pythnetwork/pyth-sui-js
```

## Usage

You can import the entire SDK as a module:

```typescript
import SevenK from "@bluefin-exchange/bluefin7k-aggregator-sdk";
```

or import specific functions as needed:

```typescript
import { getQuote, buildTx } from "@bluefin-exchange/bluefin7k-aggregator-sdk";
```

## Config

Configuration is optional, but if provided, it must be set before invoking any
SDK functions.

### Set API Key

You can use our SDK with a default rate limit of **5 requests per second**
without needing an API key.

- For **frontend (in-browser) usage**, no API key is required, and the rate
  limit cannot be increased.

- For **backend (server-side) usage**, the API key is **optional** for default
  usage. However, to request a **higher rate limit**, you must provide both an
  **API key** and **partner information**.

To request a rate limit increase, please submit your request at our [Discord](https://discord.gg/bluefinapp).
Create a ticket to request an API key for Bluefin7k Aggregator.

| Usage    | API Key Required                      | Default Rate Limit              | Can Request Higher Rate Limit                |
| -------- | ------------------------------------- | ------------------------------- | -------------------------------------------- |
| Frontend | No                                    | 5 requests/second               | No                                           |
| Backend  | Optional (required to increase limit) | 5 requests/second (without key) | Yes (requires API Key & partner information) |

```typescript
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

Config.setApiKey("YOUR_API_KEY");
console.log("API key", Config.getApiKey());
```

### Set BluefinX API key

Setting a BluefinX API key is optional. However, if you'd like to use one — for
example, to avoid rate limits when routing through BluefinX — you'll need to
request an API key directly from Bluefin.

```typescript
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

Config.setBluefinXApiKey("YOUR_BLUEFINX_API_KEY");
console.log("BluefinX API key", Config.getBluefinXApiKey());
```

### Set Sui Client

The SDK uses a single primary Sui client that accepts any `ClientWithCoreApi`
implementation (gRPC, JSON-RPC, or GraphQL). Set via `setSuiClient`. Defaults to
**gRPC** for best performance. This client is used for transaction execution,
simulation, coin fetching, and Pyth price feed operations (as of
`@pythnetwork/pyth-sui-js` v4, Pyth reads transport-agnostically through the
unified `.core` API).

#### Using gRPC (Recommended)

```typescript
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

const network = "mainnet";

// Primary client for transaction execution, simulation, and coin fetching
const suiClient = new SuiGrpcClient({
  baseUrl: "https://fullnode.mainnet.sui.io:443",
  network,
});
Config.setSuiClient(suiClient);
```

Note: this package only supports **mainnet**.

### Enable Pyth-priced sources

A few liquidity sources price their swaps from a Pyth oracle, and `buildTx` has
to attach a signed Pyth price update for a route that uses one:

- `steamm_oracle_quoter`
- `steamm_oracle_quoter_v2`
- `obric` — **not usable at present**, see below
- `haedal_pmm` — **not usable at present**, see below
- `sevenk_v1` — **not usable at present**, see below

`obric`, `haedal_pmm` and `sevenk_v1` cannot be enabled by any client
configuration today. Their on-chain packages still target the pre-upgrade Pyth
deployment, so they reject the price objects this SDK produces, and the
pre-upgrade price feeds they would otherwise read stopped updating at the
26 August 2026 Pyth Core cutover. They need a new on-chain release from each
protocol; supplying a Pyth key does not help. The rest of this section applies
to the two `steamm_oracle_quoter` sources.

**These sources are off by default.** Since the [Pyth Core
upgrade](https://docs.pyth.network/price-feeds/core/upgrade/preparing) on
26 August 2026, every Hermes caller needs an API key, so the SDK cannot fetch a
price update on its own. Quotes and swaps work fine without any Pyth setup — the
aggregator routes around these sources, and in current mainnet liquidity that
costs well under 0.01% on major pairs.

The SDK targets the upgraded Pyth Core deployment: `https://pyth.dourolabs.app/hermes`
with the upgraded Sui state objects. Get a key from Pyth Terminal (a free trial
is included), then:

```typescript
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

// Server side, holding a Pyth Pro access token directly:
Config.usePythPro({ accessToken: process.env.PYTH_ACCESS_TOKEN! });

// Browser side, where a token cannot be shipped to the client — name your own
// endpoint that holds the token on the page's behalf:
Config.usePythPro({
  updateDataUrl: "https://your.api.example/price-update-data",
});
```

The `updateDataUrl` endpoint must answer `GET <url>?ids=<comma-separated feed
ids>` with `{ "updateData": ["<base64 price update>", ...] }`.

Call this once, before any `getQuote`, alongside your other `Config` setup.

Already run your own Pyth plumbing? `Config.setPythConnection()` also enables
these sources. If you take that route you must **also** call
`Config.setPythClient()` with state ids from the same Pyth deployment your
connection fetches from: `setPythConnection` moves the price fetch and
`setPythClient` moves the on-chain state, and a mismatch between them fails
inside Wormhole's VAA verification with an error that never mentions Pyth.
`usePythPro` exists to move both together, so prefer it unless you need your
own connection object.

`setPythClient()` on its own does not enable these sources — it moves the
on-chain state ids, not the price fetch.

When a source is dropped because no Pyth endpoint is configured, the SDK logs a
one-time warning naming the sources and the setup call.

### Set Endpoint Provider (API Version)

You can toggle between different API versions:

- `"Bluefin7k"` (default) - Uses `v2/quote` endpoint
- `"Bluefin7kV2"` - Uses `v3/quote` endpoint with RFQ support

```typescript
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

// Use v2 API (default)
Config.setEndpointProvider("Bluefin7k");

// Use v3 API with RFQ support
Config.setEndpointProvider("Bluefin7kV2");
```

## Swap

See [Swap](docs/SWAP.md).

## BluefinX

See [BluefinX](docs/BLUEFINX.md).

## Limit Orders

See [Limit Orders](docs/LIMIT.md).

## DCA Orders

See [DCA Orders](docs/DCA.md).

## Prices

```typescript
import { getTokenPrice, getTokenPrices, getSuiPrice } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

const tokenPrice = await getTokenPrice(
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
);

const tokenPrices = await getTokenPrices([
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
]);

const suiPrice = await getSuiPrice();
```

## Miscellaneous

If you encounter issues when importing functions from this SDK in a Node.js
environment, refer to [src/examples/nodejs/](./src/examples/nodejs/) for
guidance.

## License

Bluefin7k Aggregator TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
