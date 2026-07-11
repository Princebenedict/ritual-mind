# Ritual Mind

Ritual Mind is the reputation and intelligence layer for Ritual Chain. It turns every
wallet into a scored identity that is recomputed every six hours inside a trusted
execution environment and attested on chain. Scores are enforced by contracts and written
only by an authorized enclave agent, so no operator can move a number by hand.

This repository is a monorepo with four workspaces and a shared documentation set.

```
contracts/   Foundry project. The on chain trust layer, five contracts plus tests.
agent/       The persistent TEE agent. Runs the six hour scoring cycle.
frontend/    Next.js 15 application. Every product surface.
sdk/         @ritualmind/sdk. A typed client for reading reputation.
docs/        Strategy, design system, folder structure, and the deployment guide.
```

## What it does

Every wallet receives a composite score out of 1000, made of four components.

- Builder, out of 400. Contract deployments, precompile usage, registered projects with
  genuine external adoption, and code quality audited by the LLM.
- Advocate, out of 300. The quality of social content about Ritual Chain, scored by the
  LLM on depth, accuracy, and originality. Quality, not volume.
- Community, out of 200. Attestations received and given, verified contributions, and
  help given to other wallets.
- User, out of 100. Distinct dApps used, active weeks, RITUAL held, and precompile use.

The composite always equals the sum of the four components.

## Trust and anti gaming

The rules that can be expressed on chain are enforced by the contracts, not trusted to the
agent.

- Wallets younger than seven days count at half weight.
- Composite growth is capped at fifteen percent within any rolling day, with a small
  absolute floor so new wallets can bootstrap.
- A Twitter handle links to exactly one wallet globally.
- Self attestation reverts. Re attesting the same wallet within a seven day cooldown
  reverts. Mutual attestation edges are recorded for ring detection.
- Sybil clusters and mutual attestation rings are flagged and frozen. A frozen wallet
  keeps a permanent on chain record and cannot increase its composite.
- Score history is append only and immutable.

The agent adds the judgment that only a model can make. It scores content quality, detects
purchased engagement and spam, and analyzes the interaction graph for Sybil clusters. Its
findings become penalties and flags, never unearned gains.

## Chain configuration

| Property | Value |
| --- | --- |
| Chain id | 1979 |
| Currency | RITUAL, 18 decimals |
| RPC | https://rpc.ritualfoundation.org |
| WebSocket | wss://rpc.ritualfoundation.org/ws |
| Explorer | https://explorer.ritualfoundation.org |
| Faucet | https://faucet.ritualfoundation.org |

Contract addresses are read from the environment and are never hardcoded. System
contracts and precompiles are fixed constants on Ritual Chain.

## Quick start

### Contracts

```bash
cd contracts
forge build
forge test
# Deploy. Set PRIVATE_KEY for your funded wallet first. See contracts/.env.example.
forge script script/Deploy.s.sol:Deploy --rpc-url "$RITUAL_RPC_URL" --broadcast -vvvv
```

### Agent

```bash
cd agent
npm install
cp .env.example .env   # fill in the agent key and deployed addresses
npm run typecheck
npm run cycle          # run a single cycle
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # optional, the app runs on demo data without it
npm run dev
```

### SDK

```bash
cd sdk
npm install
npm run build
```

## Architecture

```
                 six hour cycle
  TEE agent  ─────────────────────►  ScoreOracle  ──►  WalletRegistry
   (enclave)   attested scores          (only          (enforces caps,
      │                                  writer)         daily limit, freeze)
      │ HTTP 0x0801                          │
      │ LLM 0x0802                           ├──►  BadgeNFT       (soulbound mints)
      ▼                                      ├──►  ProjectRegistry (metrics)
  Twitter, explorer                          └──►  ActivityEmitter (live feed)
                                                        │
  Frontend  ◄──── WebSocket events ◄─────────────────────┘
  SDK       ◄──── view reads
```

## Documentation

- docs/PRODUCT_STRATEGY.md. Positioning, information architecture, and user flows.
- docs/DESIGN_SYSTEM.md. Color, type, motion, and the strict presentation rules.
- docs/FOLDER_STRUCTURE.md. The repository layout and address handling rules.
- docs/DEPLOYMENT.md. Folders to local development to testnet to Vercel, with
  troubleshooting.

## Verification status

- Contracts. forge build clean. 60 tests pass. Line coverage is about ninety five percent
  overall, with the WalletRegistry anti gaming core above ninety six percent.
- Agent. TypeScript strict typecheck clean with no use of any. The scoring algorithm is
  covered by a behavioral self check.
- Frontend. next build succeeds. All fifteen routes compile and prerender.
- SDK. TypeScript strict typecheck clean.

## License

MIT.
