import type {Address, Hex, PublicClient} from "viem";
import {SYSTEM_CONTRACTS} from "../config.js";
import {TEE_SERVICE_REGISTRY_ABI} from "./abis.js";
import {log} from "../logger.js";

export interface Executor {
  teeAddress: Address;
  publicKey: Hex;
}

/**
 * Discover a valid TEE executor for a capability from the on chain registry.
 * Never hardcode executor addresses. HTTP is capability 0, LLM is capability 1.
 * Agent precompiles also route through HTTP capability.
 */
export async function findExecutor(publicClient: PublicClient, capability: number): Promise<Executor> {
  const services = await publicClient.readContract({
    address: SYSTEM_CONTRACTS.TEE_SERVICE_REGISTRY,
    abi: TEE_SERVICE_REGISTRY_ABI,
    functionName: "getServicesByCapability",
    args: [capability, true],
  });

  const valid = services.find((service) => service.isValid && service.node.teeAddress !== "0x0000000000000000000000000000000000000000");
  if (valid === undefined) {
    throw new Error(`No valid TEE executor registered for capability ${capability}.`);
  }

  log.debug("selected executor", {capability, teeAddress: valid.node.teeAddress});
  return {teeAddress: valid.node.teeAddress, publicKey: valid.node.publicKey};
}
