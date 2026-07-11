import type {ChatMessage} from "../precompiles/llm.js";
import type {CandidateCluster} from "../scoring/antigaming.js";

/**
 * Step 4 of the cycle. Anti gaming graph analysis. The LLM reviews the candidate
 * clusters the heuristics surfaced, plus a compact description of the interaction graph,
 * and returns a final judgment per cluster with a confidence and a recommended action.
 * Output is strict JSON. The oracle applies freezes only for high confidence findings.
 */

export type ClusterAction = "none" | "watch" | "restrict" | "freeze";

export interface GraphSummary {
  walletCount: number;
  edgeCount: number;
  newWalletCount: number;
  medianWalletAgeDays: number;
}

export interface AntiGamingCluster {
  wallets: string[];
  kind: string;
  confidence: number; // 0..1
  action: ClusterAction;
  rationale: string;
}

export interface AntiGamingResult {
  clusters: AntiGamingCluster[];
}

const SYSTEM_PROMPT = [
  "You are the anti gaming module of Ritual Mind, running inside a trusted execution environment.",
  "You detect Sybil clusters, wash attestation, and closed loop rings in the reputation graph.",
  "Reputation must reflect genuine independent activity. Coordinated inauthentic behavior must not gain score.",
  "",
  "Red flags to weigh.",
  "Mutual attestation pairs and closed loops where wallets vouch for each other with no outside signal.",
  "Groups of young wallets that share a single funder and interact mostly with each other.",
  "Bursts of attestations in a short window with no accompanying on chain building or genuine usage.",
  "Uniform behavior across wallets that suggests one operator controlling many addresses.",
  "",
  "For each candidate cluster decide a confidence from 0 to 1 and one action.",
  "none. Benign. Real independent wallets that happen to interact.",
  "watch. Slightly suspicious. Record but do not penalize yet.",
  "restrict. Likely coordinated. Limit score growth.",
  "freeze. Strong evidence of a Sybil or wash cluster. Freeze the wallets and record it permanently.",
  "Only choose freeze when confidence is at least 0.8.",
  "",
  "Output strict JSON only. No prose, no markdown, no code fences.",
  'The shape is {"clusters":[{"wallets":["0x..."],"kind":"string","confidence":0.0,"action":"none","rationale":"one short sentence"}]}',
].join("\n");

export function buildAntiGamingMessages(candidates: CandidateCluster[], summary: GraphSummary): ChatMessage[] {
  const payload = {
    graph: summary,
    candidates: candidates.map((cluster) => ({
      wallets: cluster.wallets,
      kind: cluster.kind,
      heuristicConfidence: cluster.heuristicConfidence,
      reason: cluster.reason,
    })),
  };
  return [
    {role: "system", content: SYSTEM_PROMPT},
    {
      role: "user",
      content: `Review these candidate clusters and the graph summary. Return the JSON judgment.\n${JSON.stringify(payload)}`,
    },
  ];
}
