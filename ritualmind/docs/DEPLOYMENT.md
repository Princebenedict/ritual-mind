# Ritual Mind, deployment guide

This guide takes the project from a fresh checkout to a running deployment on Ritual
Testnet, chain 1979, with the frontend on Vercel. Follow the phases in order. Each phase
ends with a check so you never proceed past a broken step.

The deployer wallet is never hardcoded. Wherever you see DEPLOYER_WALLET_ADDRESS_HERE,
insert your own funded wallet. The deployer key lives only in contracts/.env.

## 1. Prerequisites

- Foundry. Install with `curl -L https://foundry.paradigm.xyz | bash` then `foundryup`.
- Node 20 or later, with npm.
- Two wallets. One deployer and one agent. They must be different addresses.
- Testnet RITUAL in both wallets. Use the faucet.

```bash
curl -X POST https://faucet.ritualfoundation.org/api/claim \
  -H "Content-Type: application/json" \
  -d '{"address": "DEPLOYER_WALLET_ADDRESS_HERE"}'
```

Repeat for the agent address. Confirm balances before continuing.

```bash
cast balance DEPLOYER_WALLET_ADDRESS_HERE --rpc-url https://rpc.ritualfoundation.org
```

## 2. Repository setup

```bash
git clone <your-fork> ritualmind
cd ritualmind
```

The layout is described in docs/FOLDER_STRUCTURE.md. There are four workspaces. Each has
its own env file. Copy the examples.

```bash
cp .env.example .env
cp contracts/.env.example contracts/.env
cp agent/.env.example agent/.env
cp frontend/.env.local.example frontend/.env.local
```

## 3. Local development and tests

Build and test the contracts. This is the trust layer, so it must pass before anything
else.

```bash
cd contracts
forge build
forge test -vvv
forge coverage --no-match-coverage "(test|script)"
```

Check: sixty tests pass and line coverage is above eighty percent. If a test fails, stop
and fix it before deploying.

Typecheck the agent and the SDK.

```bash
cd ../agent && npm install && npm run typecheck
cd ../sdk && npm install && npm run typecheck
```

Run the frontend on demo data. It does not need deployed contracts to render.

```bash
cd ../frontend && npm install && npm run dev
```

Check: the app loads at http://localhost:3000 with a full homepage, a live feed, and
working navigation.

## 4. Deploy to Ritual Testnet

Set the deployer key in contracts/.env.

```bash
# contracts/.env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY_FOR_DEPLOYER_WALLET_ADDRESS_HERE
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
RITUAL_VERIFIER_URL=https://rpc.ritualfoundation.org/api/verify
# Optional. Authorize the agent during deployment.
AGENT_ADDRESS=
AGENT_TEE_KEY=
```

Deploy all five contracts in order with permissions wired in one broadcast.

```bash
cd contracts
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RITUAL_RPC_URL" \
  --broadcast \
  -vvvv
```

The script prints the five addresses. Copy them.

```
ActivityEmitter: 0x...
BadgeNFT:        0x...
WalletRegistry:  0x...
ProjectRegistry: 0x...
ScoreOracle:     0x...
```

The deploy script performs this wiring for you.

- ActivityEmitter authorizes WalletRegistry, ProjectRegistry, and ScoreOracle as writers.
- WalletRegistry sets the oracle to ScoreOracle.
- BadgeNFT sets the minter to ScoreOracle.
- ProjectRegistry sets the updater to ScoreOracle.
- If AGENT_ADDRESS is set, ScoreOracle authorizes the agent.

Record the addresses in every env file. The agent uses unprefixed names. The frontend uses
NEXT_PUBLIC prefixed names.

```bash
# agent/.env
SCORE_ORACLE_ADDRESS=0x...
WALLET_REGISTRY_ADDRESS=0x...
PROJECT_REGISTRY_ADDRESS=0x...
ACTIVITY_EMITTER_ADDRESS=0x...

# frontend/.env.local
NEXT_PUBLIC_SCORE_ORACLE=0x...
NEXT_PUBLIC_WALLET_REGISTRY=0x...
NEXT_PUBLIC_PROJECT_REGISTRY=0x...
NEXT_PUBLIC_BADGE_NFT=0x...
NEXT_PUBLIC_ACTIVITY_EMITTER=0x...
```

## 5. Verify the contracts

Ritual Chain uses a custom verification service on the RPC domain. Do not use Sourcify.

```bash
forge verify-contract \
  --chain 1979 \
  --watch \
  --verifier custom \
  --verifier-url "$RITUAL_VERIFIER_URL" \
  --verifier-api-key unused \
  <WALLET_REGISTRY_ADDRESS> \
  src/WalletRegistry.sol:WalletRegistry
```

Repeat for each contract with its constructor arguments. Check: each returns
`Pass - Verified` and the source appears on the explorer.

## 6. Fund the agent

The agent pays its own gas from the agent wallet and pays executor fees from a RitualWallet
deposit. Deposit RITUAL into the RitualWallet against the agent address.

```bash
cast send 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948 \
  "deposit(uint256)" 100000 \
  --value 5ether \
  --rpc-url "$RITUAL_RPC_URL" \
  --private-key "$AGENT_PRIVATE_KEY"
```

Check the deposit.

```bash
cast call 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948 \
  "balanceOf(address)(uint256)" <AGENT_ADDRESS> \
  --rpc-url "$RITUAL_RPC_URL"
```

The agent also runs a self maintenance step. If the RitualWallet balance falls below the
threshold, it emits a low funds signal to the feed and tops up from the agent wallet if it
holds native RITUAL.

## 7. Authorize the agent and confirm executors

If you did not set AGENT_ADDRESS at deploy time, authorize the agent now. The teeKey binds
the agent to its enclave attestation identity.

```bash
cast send <SCORE_ORACLE_ADDRESS> \
  "authorizeAgent(address,bytes32)" <AGENT_ADDRESS> <TEE_KEY_BYTES32> \
  --rpc-url "$RITUAL_RPC_URL" \
  --private-key "$PRIVATE_KEY"
```

Confirm the agent is authorized.

```bash
cast call <SCORE_ORACLE_ADDRESS> "isAuthorizedAgent(address)(bool)" <AGENT_ADDRESS> \
  --rpc-url "$RITUAL_RPC_URL"
```

Confirm that TEE executors are available for the capabilities the agent uses. HTTP is
capability 0 and LLM is capability 1. The agent queries the TEEServiceRegistry for a valid
executor before every precompile call, so a missing executor is the most common cause of a
stuck cycle.

```bash
cast call 0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F \
  "getServicesByCapability(uint8,bool)" 1 true \
  --rpc-url "$RITUAL_RPC_URL"
```

## 8. Run the agent

Run a single cycle first to confirm the full path works end to end.

```bash
cd agent
npm run cycle
```

Check the structured logs. You should see the social fetch, content scoring, on chain
scan, anti gaming pass, a batch submit, and a cycle record. Then run continuously.

```bash
npm run build
node dist/index.js
```

The running agent drives its own six hour cadence. For a production persistent agent
deployed through the Persistent Agent factory, the launcher arms the Scheduler system
contract so the cycle is driven on chain. Only contracts can call the Scheduler, so an EOA
agent uses its internal timer as documented in agent/src/scheduler.ts.

Run the agent under a process manager so it restarts on failure. A systemd unit or a
container with a restart policy both work.

## 9. Deploy the frontend to Vercel

The frontend is a standard Next.js 15 application.

```bash
cd frontend
npm run build   # confirm a clean production build locally first
```

Then deploy.

- Import the repository into Vercel and set the root directory to `frontend`.
- Add the NEXT_PUBLIC environment variables from frontend/.env.local.
- Build command `next build`, output handled by the Vercel Next.js runtime.

Without the contract addresses the app renders on demo data, so a preview deployment works
immediately. With the addresses set, wire the hooks in lib/hooks.ts to read live data and
attach the ActivityEmitter WebSocket subscription for the live feed.

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Deploy reverts on wiring | The deployer is not the owner of a contract | Deploy all five in one run so the deployer owns each. |
| Verify returns unsupported chain | Sourcify used by default | Add `--verifier custom --verifier-url "$RITUAL_VERIFIER_URL"`. |
| Agent cycle hangs on a precompile | No valid TEE executor for the capability | Query the registry. Wait for an executor or use a different endpoint. |
| Precompile returns empty output | The call was simulated but not settled | Read the settled receipt spcCalls, not the eth_call result. The agent handles this. |
| submitUpdate reverts | The agent address is not authorized | Call authorizeAgent from the owner and confirm with isAuthorizedAgent. |
| Score does not increase | Daily cap or new wallet multiplier | Growth is capped at fifteen percent per day. New wallets count at half weight for seven days. This is intended. |
| Frontend shows empty state | Contract addresses set but unreachable | Confirm the addresses are correct for chain 1979 and the RPC is reachable. Unset them to fall back to demo data. |
| Wrong network in wallet | Wallet on a different chain | Switch to chain 1979. The app prompts for this. |

## Post deployment checklist

- [ ] All five contracts verified on the explorer.
- [ ] Oracle wired as the registry oracle, badge minter, and project updater.
- [ ] Agent authorized on the oracle and confirmed with isAuthorizedAgent.
- [ ] RitualWallet funded against the agent address with a lock that covers the cycle.
- [ ] A single agent cycle completed and wrote scores.
- [ ] Frontend deployed with the correct NEXT_PUBLIC addresses.
- [ ] Event listeners cover the full async lifecycle, including failed and expired states.
