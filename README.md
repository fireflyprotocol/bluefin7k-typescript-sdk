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

### Set Sui Client

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Config } from "@bluefin-exchange/bluefin7k-aggregator-sdk";

const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
Config.setSuiClient(suiClient);
console.log("Sui client", Config.getSuiClient());
```

Note: this package only supports **mainnet**.

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
