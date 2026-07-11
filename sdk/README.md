# @ritualmind/sdk

A typed TypeScript client for reading Ritual Mind reputation on Ritual Chain. It reads
your deployed contracts through a viem public client and returns fully typed results.
Every value it returns is backed by an on chain score that was computed inside a trusted
execution environment and written with an attestation hash, so your users can verify it.

## Install

```bash
npm install @ritualmind/sdk viem
```

## Quick start

```ts
import {createRitualMind} from "@ritualmind/sdk";

const mind = createRitualMind({
  rpcUrl: "https://rpc.ritualfoundation.org",
  walletRegistry: "0xYOUR_WALLET_REGISTRY",
  projectRegistry: "0xYOUR_PROJECT_REGISTRY",
  badgeNFT: "0xYOUR_BADGE_NFT",
  activityEmitter: "0xYOUR_ACTIVITY_EMITTER",
});

const score = await mind.getScore("0xWALLET");
// {composite, builder, advocate, community, user, globalRank, isVerifiedBuilder, ...}

const verified = await mind.isVerifiedBuilder("0xWALLET");
const badges = await mind.getBadges("0xWALLET");
const leaderboard = await mind.getTopWallets(25);
const metrics = await mind.getProjectMetrics("0xPROJECT");
```

## Reads

| Method | Returns | Notes |
| --- | --- | --- |
| `getScore(wallet)` | `Score` | Composite, four sub scores, rank, verification, streak. |
| `isVerifiedBuilder(wallet)` | `boolean` | Verified builder status. |
| `getBadges(wallet)` | `Badge[]` | Earned soulbound badges with timestamps. Needs `badgeNFT`. |
| `getProjectMetrics(address)` | `ProjectMetrics` | Live project metrics. Needs `projectRegistry`. |
| `getTopWallets(count)` | `Score[]` | Top wallets by composite, ready for a leaderboard. |

## Writes

Writes require a viem wallet client with a connected account.

```ts
import {createWalletClient, custom} from "viem";
import {ritualChain} from "@ritualmind/sdk";

const walletClient = createWalletClient({chain: ritualChain, transport: custom(window.ethereum)});

await mind.registerProject(
  {
    contractAddress: "0xPROJECT",
    name: "Aperture",
    description: "A lending market on Ritual.",
    category: "DEFI",
    url: "https://aperture.xyz",
    repoUrl: "https://github.com/org/aperture",
  },
  walletClient,
);
```

`emitActivity` sends a feed event through the ActivityEmitter. The sending address must be
an authorized writer on that contract.

```ts
await mind.emitActivity({type: "contractDeployed", deployer: "0xYOU", contractAddress: "0xNEW"}, walletClient);
```

## Types

`Score`, `Badge`, `ProjectMetrics`, `ProjectCategory`, and `RegisterProjectParams` are all
exported. The client is framework agnostic and works in the browser, in Node, and in edge
runtimes.

## Notes

- Ritual Chain is chain id 1979 and requires EIP-1559 transactions. The exported
  `ritualChain` is preconfigured for this.
- Reads are standard view calls and are synchronous. They do not consume RITUAL.
- Contract addresses change on every deployment. Read them from your environment and pass
  them to `createRitualMind`. Do not hardcode them.
