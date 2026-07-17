/**
 * Ritual ecosystem directory.
 *
 * This is a curated list of real projects and infrastructure building on Ritual Chain. It
 * is intentionally a plain data file, not a registry read, so there is no registration and
 * no wallet needed — projects appear here because they are part of the ecosystem, arranged
 * by category.
 *
 * TO ADD A PROJECT: copy one entry below, edit the fields, and commit. The Projects page
 * updates automatically. Keep it honest — link only to things that really exist, and do not
 * invent usage numbers. If you know a contract address on Ritual Chain, add it as `contract`
 * and it will link to the explorer.
 */

export type EcoCategory = "Infrastructure" | "AI Compute" | "Developer Tools" | "Reputation" | "Ecosystem";

export interface EcoProject {
  id: string;
  name: string;
  category: EcoCategory;
  summary: string;
  /** Primary link (website or app). */
  url: string;
  /** Optional extra links. */
  docs?: string;
  x?: string;
  github?: string;
  /** Optional on-chain contract on Ritual Chain (links to the explorer). */
  contract?: string;
  /** Official Ritual Foundation property. */
  official?: boolean;
}

export const ECOSYSTEM: EcoProject[] = [
  {
    id: "ritual-chain",
    name: "Ritual Chain",
    category: "Infrastructure",
    summary:
      "The Layer 1 with AI embedded directly in the chain — EVM++, Symphony consensus, and a native model marketplace, so contracts can call models as first-class operations.",
    url: "https://ritual.net",
    docs: "https://docs.ritualfoundation.org",
    x: "https://x.com/ritualnet",
    official: true,
  },
  {
    id: "infernet",
    name: "Infernet",
    category: "AI Compute",
    summary:
      "Ritual's decentralized oracle network for AI workloads. Thousands of independent nodes connect off-chain compute to on-chain smart contracts on any EVM chain.",
    url: "https://ritual.net",
    docs: "https://docs.ritualfoundation.org",
    official: true,
  },
  {
    id: "realm",
    name: "Realm",
    category: "Ecosystem",
    summary:
      "The Ritual Foundation's builder program. Technical, educational, and financial support for teams shipping on Ritual Chain. The front door for new ecosystem projects.",
    url: "https://ritualfoundation.org",
    official: true,
  },
  {
    id: "ritual-explorer",
    name: "Ritual Explorer",
    category: "Developer Tools",
    summary: "The official block explorer for Ritual Chain (id 1979). Inspect blocks, transactions, and contracts.",
    url: "https://explorer.ritualfoundation.org",
    official: true,
  },
  {
    id: "ritual-faucet",
    name: "Ritual Faucet",
    category: "Developer Tools",
    summary: "Testnet faucet for RITUAL. Fund a wallet to start deploying and calling precompiles.",
    url: "https://faucet.ritualfoundation.org",
    official: true,
  },
  {
    id: "ritual-docs",
    name: "Ritual Docs",
    category: "Developer Tools",
    summary: "Developer documentation — architecture, precompiles, the async lifecycle, and integration guides.",
    url: "https://docs.ritualfoundation.org",
    official: true,
  },
  {
    id: "ritual-mind",
    name: "Ritual Mind",
    category: "Reputation",
    summary:
      "The reputation and intelligence layer for Ritual Chain — this app. Wallet scores computed in a TEE and attested on chain, plus a decoded live activity feed.",
    url: "https://ritual-mind.vercel.app",
  },
];

export const ECO_CATEGORIES: EcoCategory[] = [
  "Infrastructure",
  "AI Compute",
  "Developer Tools",
  "Reputation",
  "Ecosystem",
];
