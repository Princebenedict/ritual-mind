import {createPublicClient, defineChain, http, type PublicClient} from "viem";

/** Ritual Testnet, chain id 1979. */
export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: {name: "RITUAL", symbol: "RITUAL", decimals: 18},
  rpcUrls: {default: {http: ["https://rpc.ritualfoundation.org"]}},
  blockExplorers: {default: {name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org"}},
});

/** Build a read only public client for Ritual Chain. */
export function makePublicClient(rpcUrl?: string): PublicClient {
  return createPublicClient({
    chain: ritualChain,
    transport: http(rpcUrl ?? "https://rpc.ritualfoundation.org"),
  });
}
