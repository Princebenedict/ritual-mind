import type {AgentConfig} from "./config.js";
import {CAPABILITY} from "./config.js";
import type {ChainClients} from "./chain/client.js";
import {findExecutor} from "./chain/executors.js";
import {buildSecretBundle} from "./chain/secrets.js";
import {callHttp, HTTP_METHOD, jsonBody} from "./precompiles/http.js";
import type {DigestOutput} from "./prompts/digest.js";
import {log} from "./logger.js";

/**
 * Pin the daily digest JSON to IPFS through Pinata, routed via the HTTP precompile.
 * The Pinata JWT is encrypted to the executor and replaced inside the enclave. Returns
 * the content identifier to record on chain. If no credentials are configured, returns
 * an empty string and the caller records an empty CID.
 */
export async function pinDigest(
  clients: ChainClients,
  config: AgentConfig,
  digest: DigestOutput,
  dayIndex: number,
): Promise<string> {
  if (config.ipfs.pinataJwt.length === 0) {
    log.warn("No Pinata JWT configured. Digest will be posted without an IPFS CID.");
    return "";
  }

  const executor = await findExecutor(clients.publicClient, CAPABILITY.HTTP_CALL);
  const bundle = await buildSecretBundle(clients.walletClient, clients.account, executor.publicKey, {
    PINATA_JWT: config.ipfs.pinataJwt,
  });

  const response = await callHttp(clients, {
    executor: executor.teeAddress,
    url: `${config.ipfs.pinataBaseUrl.replace(/\/$/, "")}/pinning/pinJSONToIPFS`,
    method: HTTP_METHOD.POST,
    headerKeys: ["Authorization", "Content-Type"],
    headerValues: ["Bearer PINATA_JWT", "application/json"],
    body: jsonBody({
      pinataContent: digest,
      pinataMetadata: {name: `ritual-mind-digest-${dayIndex}`},
    }),
    encryptedSecrets: bundle.encryptedSecrets,
    secretSignatures: bundle.secretSignatures,
  });

  if (response.errorMessage.length > 0 || response.statusCode >= 400) {
    log.error("Pinata pin failed", {status: response.statusCode, error: response.errorMessage});
    return "";
  }

  try {
    const parsed = JSON.parse(response.body) as {IpfsHash?: string};
    return parsed.IpfsHash ?? "";
  } catch {
    return "";
  }
}
