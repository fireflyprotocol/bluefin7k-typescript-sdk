# bluefin7k-typescript-sdk

Published as `@bluefin-exchange/bluefin7k-aggregator-sdk` on npm.

## Overview

TypeScript SDK for Bluefin's DEX aggregator on SUI. Used by the swap UI,
spot-probing-bots, and external integrators to fetch quotes, build swap
transactions, and execute them on-chain. Acts as the client-side counterpart to
`bluefin7k-aggregator-api`.

## Architecture Role

```
bluefin7k-aggregator-api (Rust, quotes + routing)
        ↑ HTTP
        |
bluefin7k-typescript-sdk (this package)
        ↑ import
        |
perpetual-ui / spot-probing-bots / external integrators
```

The SDK:

1. Fetches optimal swap quotes from the aggregator API (`getQuote`)
2. Fetches protocol config (package IDs, shared objects) from `/config` endpoint
3. Builds SUI Move transactions targeting the correct protocol contracts
   (`buildTx`)
4. Executes dry runs for gas estimation
5. Submits signed transactions on-chain (`executeTx`)

## Key Flows

### Quote → Build → Execute

```
getQuote(params)        → QuoteResponse (routes, swaps, amounts)
buildTx(quoteResponse)  → Transaction (SUI PTB with Move calls per protocol)
executeTx(tx, sig)      → on-chain execution
```

### Config Resolution

The SDK fetches protocol config from the aggregator API with a 60-second TTL
cache:

- `getConfig()` → calls `GET /config` on the aggregator API
- Throws if `/config` is unreachable. The SDK does **not** carry a hardcoded
  fallback — stale package IDs in client-side bundles caused real on-chain
  failures (BET-3924, BET-3930), so the contract is fail-loud, not fail-stale.
- Config contains package IDs and shared object addresses for each DEX protocol

## Project Structure

```
src/
├── index.ts                          # Public API exports
├── config/index.ts                   # Config singleton (SUI client, API keys, base URL)
├── constants/
│   ├── apiEndpoints.ts               # Aggregator API base URL (configurable via Config.setBaseUrl)
│   ├── _7k.ts                        # 7K settlement contract addresses
│   └── tokens.ts                     # Token type constants
├── features/
│   ├── swap/
│   │   ├── getQuote.ts               # Quote fetching, DEFAULT_SOURCES list
│   │   ├── buildTx.ts                # Transaction building, gas estimation via dry run
│   │   └── config.ts                 # Protocol config fetch (throws on /config failure)
│   ├── prices/                       # Token price lookups
│   └── limitDca/                     # Limit order and DCA features
├── libs/
│   ├── protocols/                    # Per-protocol Move call builders
│   │   ├── base.ts                   # BaseContract (shared logic)
│   │   ├── index.ts                  # ProtocolContract registry (pool type → contract class)
│   │   ├── fullsail/index.ts         # Fullsail swap implementation
│   │   ├── cetus/index.ts            # Cetus swap implementation
│   │   ├── bluefinx/                 # BluefinX (sponsored tx flow)
│   │   ├── steamm/index.ts           # Steamm (oracle-based, Pyth price feeds)
│   │   └── ...                       # One module per protocol
│   ├── swapWithRoute.ts              # Route execution dispatcher
│   └── getSplitCoinForTx.ts          # Coin selection, merge, split logic
├── types/aggregator.ts               # QuoteResponse, Config, SourceDex types
└── utils/
    ├── sui.ts                        # SUI utilities (coin values, balances)
    └── token.ts                      # Token type normalization
```

## Technology Stack

- **Language:** TypeScript (dual CJS/ESM output)
- **Blockchain:** `@mysten/sui` SDK
- **Build:** `tsc` with `tsc-alias`, separate CJS and ESM configs
- **Test:** Mocha + Chai
- **Formatting:** Prettier

## Build & Test

```bash
npm run build          # Clean + build ESM + CJS
npm run tsc            # Type check only (no emit)
npm test               # Run all mocha tests (60s timeout)

# Run a specific test file
npx mocha --no-config --require ts-node/register --timeout 60000 tests/config.spec.ts
```

## Publishing

```bash
npm run publish:patch  # Bump patch version + publish to npm
npm run publish:minor  # Bump minor version + publish to npm
npm run publish:beta   # Publish beta tag
```

## Supported Protocols (DEFAULT_SOURCES)

suiswap, turbos, cetus, bluemove, kriya, kriya_v3, aftermath, deepbook_v3,
flowx, flowx_v3, bluefin, springsui, obric, stsui, magma, haedal_pmm, momentum,
sevenk_v1, fullsail, cetus_dlmm, ferra_dlmm, ferra_clmm

Additional protocols (not in defaults): steamm, steamm_oracle_quoter,
steamm_oracle_quoter_v2, bluefinx, RFQ

## Important Notes

- **`exports` field in package.json** restricts subpath imports. Consumers can
  only import from the package root
  (`@bluefin-exchange/bluefin7k-aggregator-sdk`), not internal paths like
  `lib/cjs/constants/...`. Use `Config.setBaseUrl()` instead of hacking around
  this.
- **No hardcoded protocol config in the SDK.** Removed in BET-3930. If
  `/config` fails to fetch, `getConfig` throws and `buildTx` propagates the
  error. Stale fallbacks would silently ship wrong package IDs to wallets.
- **Gas estimation** uses a 2x safety multiplier on dry run results to account
  for state drift between simulation and execution (especially for Steamm's
  dynamic fields).
- **BluefinX** uses sponsored transactions — `devInspect` and normal dry run
  don't work for it.
