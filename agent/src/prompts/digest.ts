import type {ChatMessage} from "../precompiles/llm.js";

/**
 * Step 6 of the cycle, once per day at 00:00 UTC. The LLM writes an ecosystem brief
 * from the day's on chain and social activity. Output is strict JSON. The digest is
 * posted to the ActivityEmitter and its content is pinned to IPFS with the CID recorded
 * on chain alongside the TEE attestation hash.
 */

export interface DigestInput {
  dayIndex: number;
  newWallets: number;
  totalWallets: number;
  topMovers: Array<{wallet: string; compositeDelta: number}>;
  trendingProjects: Array<{name: string; healthScore: number; growthRate: number}>;
  notableContent: Array<{author: string; summary: string}>;
  flaggedClusters: number;
}

export interface DigestSection {
  heading: string;
  body: string;
}

export interface DigestOutput {
  title: string;
  summary: string;
  sections: DigestSection[];
  highlights: string[];
  sentiment: "bullish" | "neutral" | "cautious";
}

const SYSTEM_PROMPT = [
  "You are the intelligence module of Ritual Mind, running inside a trusted execution environment.",
  "You write a concise daily ecosystem brief for Ritual Chain from the day's activity.",
  "Write in a strict professional tone. Sentence case. No exclamation marks. No hype words.",
  "Do not use emoji. Do not use em dashes or double hyphens. Separate sentences with periods.",
  "State what happened plainly and let the numbers carry the weight. Be accurate and specific.",
  "",
  "Cover new wallet growth, notable score movements, trending projects, and the quality of social activity.",
  "If clusters were flagged, note that anti gaming enforcement acted, without naming wallets.",
  "",
  "Output strict JSON only. No prose, no markdown, no code fences.",
  'The shape is {"title":"string","summary":"string","sections":[{"heading":"string","body":"string"}],"highlights":["string"],"sentiment":"neutral"}',
  "sentiment is one of bullish, neutral, or cautious, chosen from the data.",
].join("\n");

export function buildDigestMessages(input: DigestInput): ChatMessage[] {
  return [
    {role: "system", content: SYSTEM_PROMPT},
    {role: "user", content: `Write the daily brief from this data. Return the JSON object.\n${JSON.stringify(input)}`},
  ];
}
