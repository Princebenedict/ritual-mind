import {createPublicClient, createWalletClient, http, type PublicClient, type WalletClient, type Account} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {ritualChain, type AgentConfig} from "../config.js";

export interface ChainClients {
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient;
}

/**
 * Build the viem public and wallet clients for Ritual Chain from the agent key.
 * The wallet client signs transactions and pays gas from the agent's own balance.
 */
export function createClients(config: AgentConfig): ChainClients {
  const account = privateKeyToAccount(config.agentPrivateKey);
  const transport = http(config.rpcUrl);
  const publicClient = createPublicClient({chain: ritualChain, transport});
  const walletClient = createWalletClient({account, chain: ritualChain, transport});
  return {account, publicClient, walletClient};
}
