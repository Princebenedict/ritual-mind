import type {Address, Hex} from "viem";
import {SYSTEM_CONTRACTS} from "../config.js";
import {ASYNC_JOB_TRACKER_ABI} from "../chain/abis.js";
import type {ChainClients} from "../chain/client.js";

/**
 * A Ritual transaction receipt carries an spcCalls field: one entry for each short running
 * async precompile call settled in the transaction. Each entry records the precompile
 * address and its settled output. This shape is not on the standard viem receipt, so it is
 * declared here and read defensively.
 *
 * IMPORTANT: `spcCalls[i].output` is the DIRECT precompile response, already settled. It is
 * NOT the `(bytes simmedInput, bytes actualOutput)` envelope. That envelope is only what an
 * on chain `precompile.call(input)` returns to a Solidity contract; the off chain receipt
 * exposes the already unwrapped result. Decode `output` straight against the precompile's
 * response ABI. Applying a `(bytes, bytes)` unwrap here misaligns the decode — response
 * bytes get read as ABI offsets and lengths, which viem coerces to Number and throws
 * "... is not in safe integer range" (e.g. an HTTP status word of 200 read as a byte
 * offset, then a body word read as a length).
 */
export interface RitualSpcCall {
  address?: Address;
  output?: Hex;
}

export interface RitualReceipt {
  spcCalls?: RitualSpcCall[];
}

/**
 * Return the settled output of the async precompile call for `precompile`, or null if the
 * receipt carries no settled call for it yet (still in the commitment phase). The output is
 * the raw precompile response bytes; the caller decodes it with the precompile's response
 * ABI. Every chain value stays a Hex/BigInt here — nothing is coerced to Number.
 */
export function extractSpcOutput(receipt: unknown, precompile: Address): Hex | null {
  const spcCalls = (receipt as RitualReceipt).spcCalls;
  if (spcCalls === undefined || spcCalls.length === 0) {
    return null;
  }
  const target = precompile.toLowerCase();
  const match =
    spcCalls.find((call) => call.address?.toLowerCase() === target) ??
    (spcCalls.length === 1 ? spcCalls[0] : undefined);
  const output = match?.output;
  if (output === undefined || output === "0x") {
    return null;
  }
  return output;
}

const SETTLE_POLL_MS = 3_000;
const SETTLE_MAX_ATTEMPTS = 100; // ~5 min ceiling; the receipt normally already carries the result

/**
 * Submit-and-await for a short running async precompile. Waits for the deferred origin
 * transaction receipt — which the chain only produces once the executor result has settled
 * and been injected via the SPC mechanism — then returns the settled precompile output.
 *
 * The origin receipt normally already carries the settled `spcCalls` output, so the common
 * path returns immediately. As a safeguard against observing the receipt during the
 * commitment phase, this awaits the async job through `AsyncJobTracker.hasPendingJobForSender`
 * before re-reading the receipt, rather than assuming the result is inline.
 */
export async function waitForSpcOutput(clients: ChainClients, hash: Hex, precompile: Address): Promise<Hex> {
  const {publicClient, account} = clients;

  const receipt = await publicClient.waitForTransactionReceipt({hash});
  const settled = extractSpcOutput(receipt, precompile);
  if (settled !== null) {
    return settled;
  }

  // Commitment phase: the job is recorded but not yet settled. Await settlement by watching
  // the sender lock on AsyncJobTracker, then re-read the settled receipt.
  for (let attempt = 0; attempt < SETTLE_MAX_ATTEMPTS; attempt += 1) {
    const pending = await publicClient.readContract({
      address: SYSTEM_CONTRACTS.ASYNC_JOB_TRACKER,
      abi: ASYNC_JOB_TRACKER_ABI,
      functionName: "hasPendingJobForSender",
      args: [account.address],
    });
    if (!pending) {
      const next = await publicClient.getTransactionReceipt({hash});
      const output = extractSpcOutput(next, precompile);
      if (output !== null) {
        return output;
      }
    }
    await sleep(SETTLE_POLL_MS);
  }

  throw new Error(`Async precompile ${precompile} did not settle for tx ${hash} within the settlement window.`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
