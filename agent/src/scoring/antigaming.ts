import type {Address} from "viem";

/**
 * Heuristic graph analysis that prepares Sybil candidate clusters for the LLM pass.
 * The agent never freezes a wallet on heuristics alone. These helpers surface
 * suspicious structure. The LLM in step four makes the final judgment, and the oracle
 * records the flag on chain with the attestation hash.
 */

export interface InteractionEdge {
  from: Address;
  to: Address;
  timestamp: number;
}

export interface WalletNode {
  wallet: Address;
  ageDays: number;
  funder: Address | null;
}

export type ClusterKind = "mutual" | "ring" | "shared-funder";

export interface CandidateCluster {
  wallets: Address[];
  kind: ClusterKind;
  heuristicConfidence: number; // 0..1
  reason: string;
}

function key(a: Address): string {
  return a.toLowerCase();
}

/** Pairs where both wallets attest each other. */
export function detectMutualPairs(edges: InteractionEdge[]): CandidateCluster[] {
  const present = new Set<string>();
  for (const edge of edges) {
    present.add(`${key(edge.from)}->${key(edge.to)}`);
  }
  const seen = new Set<string>();
  const clusters: CandidateCluster[] = [];
  for (const edge of edges) {
    const forward = `${key(edge.from)}->${key(edge.to)}`;
    const backward = `${key(edge.to)}->${key(edge.from)}`;
    if (present.has(backward)) {
      const pairId = [key(edge.from), key(edge.to)].sort().join("|");
      if (!seen.has(pairId)) {
        seen.add(pairId);
        clusters.push({
          wallets: [edge.from, edge.to],
          kind: "mutual",
          heuristicConfidence: 0.5,
          reason: "Both wallets attest each other, forming a mutual pair.",
        });
      }
    }
    void forward;
  }
  return clusters;
}

/** Directed cycles up to a bounded length, deduped by member set. */
export function detectRings(edges: InteractionEdge[], maxLength = 5): CandidateCluster[] {
  const adjacency = new Map<string, string[]>();
  const label = new Map<string, Address>();
  for (const edge of edges) {
    const from = key(edge.from);
    const to = key(edge.to);
    label.set(from, edge.from);
    label.set(to, edge.to);
    const list = adjacency.get(from) ?? [];
    list.push(to);
    adjacency.set(from, list);
  }

  const foundSets = new Set<string>();
  const clusters: CandidateCluster[] = [];

  const dfs = (start: string, current: string, path: string[], depth: number): void => {
    if (depth > maxLength) return;
    const neighbors = adjacency.get(current) ?? [];
    for (const next of neighbors) {
      if (next === start && path.length >= 3) {
        const members = [...path].sort();
        const id = members.join("|");
        if (!foundSets.has(id)) {
          foundSets.add(id);
          clusters.push({
            wallets: path.map((p) => label.get(p) as Address),
            kind: "ring",
            heuristicConfidence: Math.min(0.4 + path.length * 0.1, 0.9),
            reason: `Closed attestation ring of length ${path.length}.`,
          });
        }
        continue;
      }
      if (!path.includes(next)) {
        dfs(start, next, [...path, next], depth + 1);
      }
    }
  };

  for (const node of adjacency.keys()) {
    dfs(node, node, [node], 1);
  }
  return clusters;
}

/** Groups of young wallets sharing a common funder. A classic Sybil pattern. */
export function detectSharedFunders(nodes: WalletNode[], youngDays = 7): CandidateCluster[] {
  const byFunder = new Map<string, WalletNode[]>();
  for (const node of nodes) {
    if (node.funder === null) continue;
    const list = byFunder.get(key(node.funder)) ?? [];
    list.push(node);
    byFunder.set(key(node.funder), list);
  }

  const clusters: CandidateCluster[] = [];
  for (const group of byFunder.values()) {
    const young = group.filter((node) => node.ageDays < youngDays);
    if (young.length >= 3) {
      clusters.push({
        wallets: young.map((node) => node.wallet),
        kind: "shared-funder",
        heuristicConfidence: Math.min(0.3 + young.length * 0.1, 0.85),
        reason: `${young.length} wallets under ${youngDays} days old share one funder.`,
      });
    }
  }
  return clusters;
}

/** Combine every heuristic into a single candidate list for the LLM pass. */
export function buildCandidateClusters(nodes: WalletNode[], edges: InteractionEdge[]): CandidateCluster[] {
  return [...detectMutualPairs(edges), ...detectRings(edges), ...detectSharedFunders(nodes)];
}
