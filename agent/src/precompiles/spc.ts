import {decodeAbiParameters, type Hex} from "viem";

/**
 * A Ritual transaction receipt carries an spcCalls field with the input and output of
 * each short running async precompile call. This type is not on the standard viem
 * receipt, so it is declared here and read defensively.
 */
export interface RitualReceipt {
  spcCalls?: Array<{input: Hex; output: Hex}>;
}

/** Return the raw output of the first settled precompile call, or null if none. */
export function extractSpcOutput(receipt: unknown): Hex | null {
  const spcCalls = (receipt as RitualReceipt).spcCalls;
  if (spcCalls === undefined || spcCalls.length === 0) {
    return null;
  }
  return spcCalls[0]?.output ?? null;
}

/**
 * Unwrap the two layer async output envelope. Short running async precompiles return
 * abi.encode(bytes simmedInput, bytes actualOutput). In eth_call simulation the
 * actualOutput is empty. Callers must decode the settled receipt for final data.
 */
export function unwrapEnvelope(raw: Hex): {simmedInput: Hex; actualOutput: Hex} {
  const [simmedInput, actualOutput] = decodeAbiParameters([{type: "bytes"}, {type: "bytes"}], raw);
  return {simmedInput: simmedInput as Hex, actualOutput: actualOutput as Hex};
}
