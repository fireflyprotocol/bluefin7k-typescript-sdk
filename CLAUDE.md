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

Releases go out from `.github/workflows/npm_publish.yaml` via npm OIDC Trusted
Publishing — no stored npm token, provenance attached automatically. npm binds
the trusted publisher to org + repo + *workflow filename* and a package supports
exactly one, so that file is the only place this package is published from.

- **Release (`latest`)**: bump `version` in `package.json`, merge, then push a
  `bluefin7k-sdk-release-<version>` tag. The tag's version must equal
  `package.json`'s, and the version must not already exist on npm.
- **Canary (`next`)**: run the workflow manually (`Run workflow`) with dist-tag
  `next` against a commit on `main`. The version is synthesized as
  `<version>-next.g<sha>` and never committed back.
- **Retrying a failed release**: do not push a second tag. Fix, merge, then
  dispatch with dist-tag `latest` — the version comes from `package.json`, so
  the release still ships under its intended version.

The `publish:*` scripts in `package.json` publish from a workstation and bypass
the trusted-publishing path (no provenance); prefer the workflow.

## Supported Protocols (DEFAULT_SOURCES)

suiswap, turbos, cetus, bluemove, kriya, kriya_v3, aftermath, deepbook_v3,
flowx, flowx_v3, bluefin, springsui, obric, stsui, steamm,
steamm_oracle_quoter, steamm_oracle_quoter_v2, magma, haedal_pmm, momentum,
sevenk_v1, fullsail, cetus_dlmm, ferra_dlmm, ferra_clmm

Additional protocols (not in defaults): bluefinx, RFQ

### Oracle-priced sources need a Pyth opt-in

`ORACLE_BASED_SOURCES` — obric, haedal_pmm, sevenk_v1, steamm_oracle_quoter,
steamm_oracle_quoter_v2 — route through `updatePythPriceFeedsIfAny` in
`buildTx`, the SDK's only VAA source. Since the Pyth Core upgrade of
26 August 2026 every Hermes caller needs an API key, and the SDK ships no key,
so `getQuote` drops these sources unless a caller has replaced the default
connection via `Config.usePythPro()` or `Config.setPythConnection()`. The filter applies to an explicit `sources`
list as well as the default one, because the documented
`[...DEFAULT_SOURCES, "bluefinx"]` idiom copies the array.

`Config.setPythClient()` alone does **not** open the gate: it moves the on-chain
state ids, not the fetch.

The SDK's Pyth defaults are the **upgraded** Pyth Core deployment —
`https://pyth.dourolabs.app/hermes` plus the upgraded Sui Pyth and Wormhole
state objects, per Pyth's
[upgraded contract addresses](https://docs.pyth.network/price-feeds/core/upgrade/contracts#sui).
Sui was a manual swap, not a DAO-side upgrade: apps name the Pyth package by
object id, so nothing moved these for us.

### Which oracle sources actually work post-upgrade

`PriceInfoObject` is a **different Move type** per Pyth deployment: the upgraded
Pyth package is a fresh publish, not an in-lineage upgrade, so its type origin
differs. A protocol therefore has to link both Pyth packages side by side and
expose a `*_pro_compatible` entry point before it can take an upgraded
`PriceInfoObject`.

Resolve a protocol's **latest** package through its `UpgradeCap.package` before
concluding anything — `/config` serves lineage originals for several protocols
(`steamm.oracle` is v1 while the head is v2), and linkage-checking a v1 id
reports "not pro-compatible" even when the head is.

| source | latest package | pro-compatible |
|---|---|---|
| `steamm` (cpmm) | v18 | n/a — cpmm consults no oracle |
| `steamm_oracle_quoter{,_v2}` | steamm v18 + oracles v2 | **yes** |
| `obric` | v10 | no |
| `haedal_pmm` | v4 | no |
| `sevenk_v1` | v2 | no |

So the steamm adapter targets `oracles::get_pyth_price_pro_compatible`. That
function exists only from **oracles v2**; `/config` currently serves
`steamm.oracle` at v1, so these routes need a `/config` bump on the aggregator
before they can build. Nothing is lost in the meantime — with a v1 oracle
package the legacy getter fails too, on the `PriceInfoObject` argument.

`obric` additionally takes its Pyth state from `/config` (`obric.pythState`),
while its `PriceInfoObject` arguments come from `getPythClient()`. Measured on
mainnet: an obric route built with the upgraded deployment fails resolution with
`CommandArgumentError { arg_idx: 3, kind: TypeMismatch }` — argument 3 is the
`PriceInfoObject`. Bumping `obric.pythState` alone will **not** fix it; obric
v10 does not link the upgraded Pyth package at all.

`tests/steammOracleProLive.spec.ts` pins both halves against mainnet and skips
without `PYTH_KEY`.

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
