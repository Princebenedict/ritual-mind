import type {ChatMessage} from "../precompiles/llm.js";

/**
 * Step 2 of the cycle. Content scoring. The LLM evaluates each social post on quality,
 * not volume. Spam, low effort, and purchased engagement are red flags that reduce the
 * score, never increase it. Output is strict JSON, one object per input post.
 */

export interface SocialPostInput {
  id: string;
  author: string;
  text: string;
  impressions: number;
  isThread: boolean;
  hasVideo: boolean;
  createdAt: string;
}

export interface ContentScore {
  id: string;
  authenticity: number; // 0..10
  educational: number; // 0..10
  technicalAccuracy: number; // 0..10
  communityValue: number; // 0..10
  originality: number; // 0..10
  overallQuality: number; // 1..10, drives the advocate quality multiplier
  isSpam: boolean;
  isPurchasedEngagement: boolean;
  isRepetitiveLowEffort: boolean;
  reasoning: string;
}

const SYSTEM_PROMPT = [
  "You are the content evaluation module of Ritual Mind, running inside a trusted execution environment.",
  "You score social posts about Ritual Chain on quality, not on volume or raw engagement.",
  "You reward technical depth, educational value, originality, accuracy, and genuine community help.",
  "You penalize spam, repetitive low effort posting, and signs of purchased engagement.",
  "",
  "Score each post on five axes from 0 to 10.",
  "authenticity. Does the post read as a real person with real understanding, not a bot or a paid shill.",
  "educational. Does it teach something correct and useful about Ritual Chain or its precompiles.",
  "technicalAccuracy. Are the technical claims correct. Penalize confident errors.",
  "communityValue. Does it help other builders or users, answer questions, or reduce confusion.",
  "originality. Is it original thought, or a low effort copy of common talking points.",
  "",
  "Then set overallQuality from 1 to 10 as the single quality signal for the post.",
  "Set isSpam true for keyword stuffing, airdrop farming, unrelated promotion, or mass identical posts.",
  "Set isPurchasedEngagement true when impressions or engagement look inconsistent with content quality and author history.",
  "Set isRepetitiveLowEffort true for shallow reposts of the same point with no new value.",
  "",
  "Output strict JSON only. No prose, no markdown, no code fences.",
  "The output is a JSON array with one object per input post, in the same order, matching this shape.",
  '{"id":"string","authenticity":0,"educational":0,"technicalAccuracy":0,"communityValue":0,"originality":0,"overallQuality":1,"isSpam":false,"isPurchasedEngagement":false,"isRepetitiveLowEffort":false,"reasoning":"one short sentence"}',
].join("\n");

export function buildContentScoringMessages(posts: SocialPostInput[]): ChatMessage[] {
  const payload = posts.map((post) => ({
    id: post.id,
    author: post.author,
    text: post.text,
    impressions: post.impressions,
    isThread: post.isThread,
    hasVideo: post.hasVideo,
    createdAt: post.createdAt,
  }));
  return [
    {role: "system", content: SYSTEM_PROMPT},
    {role: "user", content: `Score these posts and return the JSON array.\n${JSON.stringify(payload)}`},
  ];
}
