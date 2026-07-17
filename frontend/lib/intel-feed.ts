/**
 * Ritual ecosystem intel feed.
 *
 * A curated briefing of real Ritual news and posts. This is a plain, editable data file so
 * you can publish updates yourself without a backend or a wallet.
 *
 * TO ADD AN ITEM: copy an entry, put it at the TOP (newest first), edit the fields, and
 * commit. The Intel page updates on the next deploy. Keep it real — link to the actual post
 * or announcement so every item can be verified. On-chain digests written by the agent
 * appear below this list automatically when they exist.
 */

export type IntelTag = "Announcement" | "Product" | "Ecosystem" | "Research" | "Funding";

export interface IntelItem {
  id: string;
  /** ISO date, used for the timestamp and sorting. Newest entries go at the top. */
  iso: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  tag: IntelTag;
}

export const INTEL_FEED: IntelItem[] = [
  {
    id: "ritual-chain-architecture",
    iso: "2025-02-01",
    title: "Ritual Chain architecture unveiled: EVM++, Symphony, and a native Model Marketplace",
    source: "Ritual Foundation",
    url: "https://ritualfoundation.com/blog/unveiling-ritual",
    summary:
      "Ritual detailed the L1 that treats AI as a first-class workload — EVM++ execution, the Symphony consensus design, and an on-chain model marketplace, so contracts can call models directly.",
    tag: "Product",
  },
  {
    id: "foundation-launch-testnet",
    iso: "2024-12-01",
    title: "Ritual Foundation launches and announces the Ritual Chain testnet",
    source: "Ritual Foundation",
    url: "https://www.crypto-reporter.com/press-releases/ritual-foundation-launches-to-advance-decentralized-ai-announces-ritual-chain-testnet-82570/",
    summary:
      "The Foundation launched to lead adoption of Ritual Chain — grants, governance, and developer support — and unveiled the private testnet for the first L1 purpose-built for AI compute.",
    tag: "Announcement",
  },
  {
    id: "realm-builder-program",
    iso: "2024-12-15",
    title: "Realm: the Ritual Foundation opens its builder program",
    source: "Ritual Foundation",
    url: "https://ritualfoundation.org",
    summary:
      "Realm offers technical, educational, and financial support to teams building on Ritual Chain. It is the front door for new ecosystem projects to get funded and shipped.",
    tag: "Ecosystem",
  },
  {
    id: "infernet-live",
    iso: "2023-11-01",
    title: "Infernet goes live — a decentralized oracle network for AI workloads",
    source: "Ritual",
    url: "https://ritual.net/blog/introducing-ritual",
    summary:
      "Ritual's first product connects off-chain AI compute to on-chain smart contracts on any EVM chain, growing to thousands of independent nodes with diverse hardware.",
    tag: "Product",
  },
  {
    id: "ritual-funding",
    iso: "2023-11-01",
    title: "Ritual raises $30M+ to build decentralized AI infrastructure",
    source: "Ritual",
    url: "https://ritual.net",
    summary:
      "Backed by top crypto funds, with a founding team drawn from Polychain, DeepMind, Paradigm, Coinbase, Citadel, and Palantir, to build the execution layer for on-chain AI.",
    tag: "Funding",
  },
];
