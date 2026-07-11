# Ritual Mind, repository structure

The repository is a monorepo with four workspaces and a shared documentation set. Contract addresses are read from environment variables. System contracts and precompiles are fixed constants. No deployer wallet is ever hardcoded. The placeholder `DEPLOYER_WALLET_ADDRESS_HERE` marks every location where the developer inserts their funded wallet.

```
ritualmind/
├── contracts/                     Foundry project, the on chain trust layer
│   ├── src/
│   │   ├── ActivityEmitter.sol    Event bus for the live feed, authorized writer pattern
│   │   ├── BadgeNFT.sol           Ten soulbound badges, non transferable, minter gated
│   │   ├── WalletRegistry.sol     Scored identity, anti gaming enforced on chain
│   │   ├── ProjectRegistry.sol    Project registry with metrics and categories
│   │   ├── ScoreOracle.sol        TEE trust anchor, batch score writes and badge minting
│   │   └── interfaces/
│   │       ├── IActivityEmitter.sol
│   │       ├── IBadgeNFT.sol
│   │       ├── IWalletRegistry.sol
│   │       ├── IProjectRegistry.sol
│   │       └── IScoreOracle.sol
│   ├── script/
│   │   └── Deploy.s.sol           Deploys all five in order and wires permissions
│   ├── test/
│   │   ├── RitualMind.t.sol       Unit, fuzz, anti gaming, access control, events
│   │   └── ScoreOracle.t.sol      Oracle, batch, badge minting, precompile mocks
│   ├── foundry.toml
│   └── .env.example
│
├── agent/                         Persistent TEE agent, the six hour cycle
│   ├── src/
│   │   ├── index.ts               Entry point and cycle scheduler
│   │   ├── cycle.ts               The seven step cycle orchestration
│   │   ├── config.ts              Chain, contract, and precompile configuration
│   │   ├── precompiles/
│   │   │   ├── http.ts            HTTP precompile 0x0801 encode and decode
│   │   │   └── llm.ts             LLM precompile 0x0802 encode and decode
│   │   ├── chain/
│   │   │   ├── client.ts          viem clients for chain 1979
│   │   │   ├── contracts.ts       Deployed contract ABIs and typed reads and writes
│   │   │   └── secrets.ts         ECIES secret encryption for the enclave
│   │   ├── scoring/
│   │   │   ├── algorithm.ts       The exact scoring algorithm, four components
│   │   │   └── antigaming.ts      Sybil, wash, and ring detection helpers
│   │   └── prompts/
│   │       ├── content.ts         Step 2 content scoring prompt, strict JSON
│   │       ├── antigaming.ts      Step 4 graph analysis prompt, strict JSON
│   │       └── digest.ts          Step 6 daily digest prompt, strict JSON
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      Next.js 15 App Router, the product surface
│   ├── app/                       Routes, one folder per surface
│   ├── components/                UI, charts, feed, rings, badges, layout
│   ├── lib/                       wagmi, viem, contracts, hooks, demo seed data
│   ├── public/                    Fonts and static assets
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local.example
│
├── sdk/                           @ritualmind/sdk, published integration client
│   ├── src/
│   │   ├── index.ts               Public exports
│   │   ├── client.ts              viem public client factory
│   │   ├── abis.ts                Minimal ABIs for reads and writes
│   │   ├── addresses.ts           Address resolution from configuration
│   │   └── types.ts               Shared types
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/
│   ├── PRODUCT_STRATEGY.md
│   ├── DESIGN_SYSTEM.md
│   ├── FOLDER_STRUCTURE.md
│   └── DEPLOYMENT.md              Folders to local dev to testnet to Vercel
│
├── README.md
└── .env.example
```

## Address handling rules

System contracts and precompiles are fixed on Ritual Chain and are declared as constants in a single module per workspace. RitualWallet, AsyncJobTracker, TEEServiceRegistry, Scheduler, SecretsAccessControl, and AsyncDelivery never change across deployments.

The five Ritual Mind contracts receive new addresses on every deployment. Those addresses are always read from environment variables. The frontend reads `NEXT_PUBLIC_` prefixed variables. The agent and the deploy scripts read unprefixed variables. After a deployment the developer updates the environment files with the printed addresses.
