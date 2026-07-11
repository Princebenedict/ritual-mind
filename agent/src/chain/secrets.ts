import {encrypt, ECIES_CONFIG} from "eciesjs";
import {toHex, type Hex, type WalletClient, type Account} from "viem";

/**
 * Secret encryption for the enclave. API keys are encrypted client side to the
 * executor's public key using ECIES, then decrypted only inside the TEE. The nonce
 * length must be 12 for Ritual. Any other value fails silently.
 */
ECIES_CONFIG.symmetricNonceLength = 12;

export function encryptSecret(secretValue: string, executorPublicKey: Hex): Hex {
  const publicKeyBytes = Buffer.from(executorPublicKey.slice(2), "hex");
  const encrypted = encrypt(publicKeyBytes, Buffer.from(secretValue, "utf-8"));
  return toHex(encrypted);
}

/**
 * Sign an encrypted secret blob with the agent key. The HTTP precompile expects an
 * EIP-191 signature over the raw encrypted bytes for each secret it receives.
 */
export async function signSecret(
  walletClient: WalletClient,
  account: Account,
  encryptedSecret: Hex,
): Promise<Hex> {
  return walletClient.signMessage({account, message: {raw: encryptedSecret}});
}

export interface EncryptedSecretBundle {
  encryptedSecrets: Hex[];
  secretSignatures: Hex[];
}

/**
 * Encrypt and sign a map of named secrets. The executor does plain string replacement,
 * so the literal placeholder names in the URL, headers, or body are swapped for values.
 */
export async function buildSecretBundle(
  walletClient: WalletClient,
  account: Account,
  executorPublicKey: Hex,
  secrets: Record<string, string>,
): Promise<EncryptedSecretBundle> {
  const entries = Object.entries(secrets).filter(([, value]) => value.length > 0);
  const encryptedSecrets: Hex[] = [];
  const secretSignatures: Hex[] = [];
  for (const [name, value] of entries) {
    const payload = JSON.stringify({[name]: value});
    const encrypted = encryptSecret(payload, executorPublicKey);
    encryptedSecrets.push(encrypted);
    secretSignatures.push(await signSecret(walletClient, account, encrypted));
  }
  return {encryptedSecrets, secretSignatures};
}
