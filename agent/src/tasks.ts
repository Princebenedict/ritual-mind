import type {AgentConfig} from "./config.js";
import {CAPABILITY} from "./config.js";
import type {ChainClients} from "./chain/client.js";
import {findExecutor} from "./chain/executors.js";
import {callLlm, extractJson} from "./precompiles/llm.js";
import {buildContentScoringMessages, type ContentScore, type SocialPostInput} from "./prompts/content.js";
import {buildAntiGamingMessages, type AntiGamingResult, type GraphSummary} from "./prompts/antigaming.js";
import {buildDigestMessages, type DigestInput, type DigestOutput} from "./prompts/digest.js";
import type {CandidateCluster} from "./scoring/antigaming.js";

/**
 * LLM backed cycle tasks. Each task selects an LLM executor, runs the precompile, and
 * parses strict JSON from the settled result. GLM emits a think block, so extractJson
 * strips it before parsing.
 */

const CONTENT_TOKENS = 8192n;
const ANALYSIS_TOKENS = 6144n;
const DIGEST_TOKENS = 6144n;

export async function scoreContent(
  clients: ChainClients,
  _config: AgentConfig,
  posts: SocialPostInput[],
): Promise<ContentScore[]> {
  if (posts.length === 0) return [];
  const executor = await findExecutor(clients.publicClient, CAPABILITY.LLM);
  const result = await callLlm(clients, {
    executor: executor.teeAddress,
    messages: buildContentScoringMessages(posts),
    maxCompletionTokens: CONTENT_TOKENS,
    reasoningEffort: "medium",
    temperatureX1000: 100n,
  });
  if (result.hasError) {
    throw new Error(`Content scoring LLM error: ${result.errorMessage}`);
  }
  return extractJson<ContentScore[]>(result.content);
}

export async function analyzeClusters(
  clients: ChainClients,
  _config: AgentConfig,
  candidates: CandidateCluster[],
  summary: GraphSummary,
): Promise<AntiGamingResult> {
  if (candidates.length === 0) return {clusters: []};
  const executor = await findExecutor(clients.publicClient, CAPABILITY.LLM);
  const result = await callLlm(clients, {
    executor: executor.teeAddress,
    messages: buildAntiGamingMessages(candidates, summary),
    maxCompletionTokens: ANALYSIS_TOKENS,
    reasoningEffort: "high",
    temperatureX1000: 0n,
  });
  if (result.hasError) {
    throw new Error(`Anti gaming LLM error: ${result.errorMessage}`);
  }
  return extractJson<AntiGamingResult>(result.content);
}

export async function generateDigest(
  clients: ChainClients,
  _config: AgentConfig,
  input: DigestInput,
): Promise<DigestOutput> {
  const executor = await findExecutor(clients.publicClient, CAPABILITY.LLM);
  const result = await callLlm(clients, {
    executor: executor.teeAddress,
    messages: buildDigestMessages(input),
    maxCompletionTokens: DIGEST_TOKENS,
    reasoningEffort: "medium",
    temperatureX1000: 300n,
  });
  if (result.hasError) {
    throw new Error(`Digest LLM error: ${result.errorMessage}`);
  }
  return extractJson<DigestOutput>(result.content);
}
