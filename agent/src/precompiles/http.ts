import {encodeAbiParameters, decodeAbiParameters, toHex, type Address, type Hex} from "viem";
import {PRECOMPILES, ritualChain} from "../config.js";
import type {ChainClients} from "../chain/client.js";
import {waitForSpcOutput} from "./spc.js";

/** HTTP method codes accepted by the precompile. Code 0 is invalid. */
export const HTTP_METHOD = {GET: 1, POST: 2, PUT: 3, DELETE: 4, PATCH: 5, HEAD: 6, OPTIONS: 7} as const;

const HTTP_REQUEST_ABI = [
  {type: "address"}, // executor
  {type: "bytes[]"}, // encryptedSecrets
  {type: "uint256"}, // ttl
  {type: "bytes[]"}, // secretSignatures
  {type: "bytes"}, // userPublicKey
  {type: "string"}, // url
  {type: "uint8"}, // method
  {type: "string[]"}, // headerKeys
  {type: "string[]"}, // headerValues
  {type: "bytes"}, // body
  {type: "uint256"}, // dkmsKeyIndex
  {type: "uint8"}, // dkmsKeyFormat
  {type: "bool"}, // piiEnabled
] as const;

const HTTP_RESPONSE_ABI = [
  {type: "uint16"}, // statusCode
  {type: "string[]"}, // headerKeys
  {type: "string[]"}, // headerValues
  {type: "bytes"}, // body
  {type: "string"}, // errorMessage
] as const;

export interface HttpRequestParams {
  executor: Address;
  url: string;
  method: number;
  headerKeys?: string[];
  headerValues?: string[];
  body?: Hex;
  ttl?: bigint;
  encryptedSecrets?: Hex[];
  secretSignatures?: Hex[];
  userPublicKey?: Hex;
}

export interface HttpResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  errorMessage: string;
}

export function encodeHttpRequest(params: HttpRequestParams): Hex {
  return encodeAbiParameters(HTTP_REQUEST_ABI, [
    params.executor,
    params.encryptedSecrets ?? [],
    params.ttl ?? 200n,
    params.secretSignatures ?? [],
    params.userPublicKey ?? "0x",
    params.url,
    params.method,
    params.headerKeys ?? [],
    params.headerValues ?? [],
    params.body ?? "0x",
    0n,
    0,
    false,
  ]);
}

function decodeBody(body: Hex): string {
  return Buffer.from(body.slice(2), "hex").toString("utf-8");
}

/**
 * Submit an HTTP precompile call and wait for the settled result. Because this is a
 * short running async precompile, the settled output is read from the receipt spcCalls
 * field, not from a callback.
 */
export async function callHttp(clients: ChainClients, params: HttpRequestParams): Promise<HttpResult> {
  const {walletClient, account} = clients;
  const data = encodeHttpRequest(params);

  const hash = await walletClient.sendTransaction({
    account,
    chain: ritualChain,
    to: PRECOMPILES.HTTP_CALL,
    data,
    gas: 2_500_000n,
    maxFeePerGas: 30_000_000_000n,
    maxPriorityFeePerGas: 2_000_000_000n,
  });

  // The settled receipt exposes the direct precompile response under spcCalls[].output;
  // decode it straight against the response ABI (no (bytes, bytes) envelope unwrap).
  const output = await waitForSpcOutput(clients, hash, PRECOMPILES.HTTP_CALL);

  const [statusCode, headerKeys, headerValues, body, errorMessage] = decodeAbiParameters(
    HTTP_RESPONSE_ABI,
    output,
  );

  const headers: Record<string, string> = {};
  const keys = headerKeys as readonly string[];
  const values = headerValues as readonly string[];
  keys.forEach((key, index) => {
    headers[key] = values[index] ?? "";
  });

  return {
    statusCode: Number(statusCode),
    headers,
    body: decodeBody(body as Hex),
    errorMessage: errorMessage as string,
  };
}

/** Convenience helper to build a JSON body as hex. */
export function jsonBody(value: unknown): Hex {
  return toHex(JSON.stringify(value));
}
