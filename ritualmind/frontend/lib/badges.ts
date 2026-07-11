export interface BadgeDefinition {
  id: number;
  title: string;
  description: string;
  requirement: string;
  accent: "brand" | "good" | "agent" | "data" | "gold" | "info";
}

/** The ten soulbound badges, aligned with BadgeNFT on chain. */
export const BADGES: BadgeDefinition[] = [
  {id: 1, title: "Genesis Builder", description: "Deployed a first contract on Ritual Chain.", requirement: "Deploy one contract", accent: "brand"},
  {id: 2, title: "Precompile Pioneer", description: "Used three or more distinct precompiles.", requirement: "3 precompiles", accent: "data"},
  {id: 3, title: "Ecosystem Architect", description: "Used all five tracked precompile families.", requirement: "5 precompiles", accent: "data"},
  {id: 4, title: "Power Poster", description: "Reached the top advocate score band for quality content.", requirement: "Advocate score band", accent: "agent"},
  {id: 5, title: "OG Ritualist", description: "Among the first one hundred wallets registered.", requirement: "First 100 wallets", accent: "gold"},
  {id: 6, title: "Connector", description: "Gave ten or more attestations to other wallets.", requirement: "10 attestations given", accent: "info"},
  {id: 7, title: "Trusted Voice", description: "Received twenty or more attestations.", requirement: "20 attestations received", accent: "good"},
  {id: 8, title: "Streak Master", description: "Sustained a six week activity streak.", requirement: "6 week streak", accent: "gold"},
  {id: 9, title: "Elite Builder", description: "Reached a builder score of three hundred or more.", requirement: "Builder 300+", accent: "brand"},
  {id: 10, title: "Ritual Legend", description: "Reached a composite score of eight hundred or more.", requirement: "Composite 800+", accent: "good"},
];

export function badgeById(id: number): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.id === id);
}
