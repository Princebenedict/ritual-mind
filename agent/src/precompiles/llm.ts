import {encodeAbiParameters, decodeAbiParameters, parseAbiParameters, type Address, type Hex} from "viem";
import {PRECOMPILES, ritualChain, LLM_MODEL} from "../config.js";
import type {ChainClients} from "../chain/client.js";
import {waitForSpcOutput} from "./spc.js";

/**
 * LLM precompile (0x0802) request ABI. Thirty fields. The base executor fields come
 * first, then the OpenAI style chat parameters, then the DA backed conversation ref.
 * GLM-4.7-FP8 is a reasoning model, so maxCompletionTokens must be at least 4096 or the
 * think block can consume the whole budget and return empty content.
 */
const LLM_REQUEST_ABI = [
  {type: "address"}, // 0 executor
  {type: "bytes[]"}, // 1 encryptedSecrets
  {type: "uint256"}, // 2 ttl
  {type: "bytes[]"}, // 3 secretSignatures
  {type: "bytes"}, // 4 userPublicKey
  {type: "string"}, // 5 messagesJson
  {type: "string"}, // 6 model
  {type: "int256"}, // 7 frequencyPenalty
  {type: "string"}, // 8 logitBiasJson
  {type: "bool"}, // 9 logprobs
  {type: "int256"}, // 10 maxCompletionTokens
  {type: "string"}, // 11 metadataJson
  {type: "string"}, // 12 modalitiesJson
  {type: "uint256"}, // 13 n
  {type: "bool"}, // 14 parallelToolCalls
  {type: "int256"}, // 15 presencePenalty
  {type: "string"}, // 16 reasoningEffort
  {type: "bytes"}, // 17 responseFormatData
  {type: "int256"}, // 18 seed
  {type: "string"}, // 19 serviceTier
  {type: "string"}, // 20 stopJson
  {type: "bool"}, // 21 stream
  {type: "int256"}, // 22 temperature
  {type: "bytes"}, // 23 toolChoiceData
  {type: "bytes"}, // 24 toolsData
  {type: "int256"}, // 25 topLogprobs
  {type: "int256"}, // 26 topP
  {type: "string"}, // 27 user
  {type: "bool"}, // 28 piiEnabled
  {type: "tuple", components: [{type: "string"}, {type: "string"}, {type: "string"}]}, // 29 convoHistory
] as const;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRequestParams {
  executor: Address;
  messages: ChatMessage[];
  model?: string;
  maxCompletionTokens?: bigint;
  reasoningEffort?: "low" | "medium" | "high";
  temperatureX1000?: bigint;
}

export interface LlmResult {
  hasError: boolean;
  content: string;
  errorMessage: string;
}

export function encodeLlmRequest(params: LlmRequestParams): Hex {
  const convo: readonly [string, string, string] = ["", "", ""];
  return encodeAbiParameters(LLM_REQUEST_ABI, [
    params.executor,
    [],
    300n,
    [],
    "0x",
    JSON.stringify(params.messages),
    params.model ?? LLM_MODEL,
    0n,
    "",
    false,
    params.maxCompletionTokens ?? 4096n,
    "",
    "",
    1n,
    true,
    0n,
    params.reasoningEffort ?? "medium",
    "0x",
    -1n,
    "auto",
    "",
    false,
    params.temperatureX1000 ?? 200n,
    "0x",
    "0x",
    -1n,
    1000n,
    "",
    false,
    convo,
  ]);
}

/** Remove the reasoning model think block so only the final answer remains. */
export function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * Extract the first JSON value from a model response. GLM emits a think block and can
 * wrap JSON in prose or code fences, so the parser strips those first.
 */
export function extractJson<T>(content: string): T {
  const cleaned = stripThink(content).replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.search(/[[{]/);
  if (firstBrace === -1) {
    throw new Error("No JSON value found in model response");
  }
  const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const slice = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(slice) as T;
}

function decodeLlmOutput(actualOutput: Hex): LlmResult {
  const [hasError, completionData, , errorMessage] = decodeAbiParameters(
    parseAbiParameters("bool, bytes, bytes, string, (string,string,string)"),
    actualOutput,
  );

  if (hasError) {
    return {hasError: true, content: "", errorMessage: errorMessage as string};
  }

  const completion = decodeAbiParameters(
    parseAbiParameters("string, string, uint256, string, string, string, uint256, bytes[], bytes"),
    completionData as Hex,
  );
  const choicesData = completion[7] as readonly Hex[];

  let content = "";
  if (choicesData.length > 0 && choicesData[0] !== undefined) {
    const [, , messageData] = decodeAbiParameters(parseAbiParameters("uint256, string, bytes"), choicesData[0]);
    const message = decodeAbiParameters(
      parseAbiParameters("string, string, string, uint256, bytes[]"),
      messageData as Hex,
    );
    content = message[1] as string;
  }

  return {hasError: false, content, errorMessage: ""};
}

/** Submit an LLM inference call and wait for the settled result from spcCalls. */
export async function callLlm(clients: ChainClients, params: LlmRequestParams): Promise<LlmResult> {
  const {walletClient, account} = clients;
  const data = encodeLlmRequest(params);

  const hash = await walletClient.sendTransaction({
    account,
    chain: ritualChain,
    to: PRECOMPILES.LLM,
    data,
    gas: 3_000_000n,
    maxFeePerGas: 30_000_000_000n,
    maxPriorityFeePerGas: 2_000_000_000n,
  });

  // LLM (0x0802) is a two-phase async precompile: this tx records a commitment, the executor
  // runs inference off chain, and the deferred origin tx settles with the result injected via
  // the SPC mechanism. Await that settlement, then decode the direct response from the
  // receipt's spcCalls[].output — there is no inline (bytes, bytes) envelope to unwrap.
  const output = await waitForSpcOutput(clients, hash, PRECOMPILES.LLM);

  return decodeLlmOutput(output);
}
