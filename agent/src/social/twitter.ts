import type {AgentConfig} from "../config.js";
import {CAPABILITY} from "../config.js";
import type {ChainClients} from "../chain/client.js";
import {findExecutor} from "../chain/executors.js";
import {buildSecretBundle} from "../chain/secrets.js";
import {callHttp, HTTP_METHOD} from "../precompiles/http.js";
import type {SocialPostInput} from "../prompts/content.js";
import {log} from "../logger.js";

/**
 * Step 1 of the cycle. Fetch recent posts about Ritual Chain through the HTTP
 * precompile. The Twitter bearer token is encrypted to the executor public key and only
 * decrypted inside the enclave. The literal placeholder TWITTER_BEARER_TOKEN in the
 * Authorization header is replaced with the real value by the executor.
 */

interface TwitterPublicMetrics {
  impression_count?: number;
  like_count?: number;
  retweet_count?: number;
}

interface TwitterTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: TwitterPublicMetrics;
  referenced_tweets?: Array<{type: string}>;
  attachments?: {media_keys?: string[]};
}

interface TwitterUser {
  id: string;
  username: string;
}

interface TwitterSearchResponse {
  data?: TwitterTweet[];
  includes?: {users?: TwitterUser[]; media?: Array<{media_key: string; type: string}>};
}

export async function fetchRecentPosts(clients: ChainClients, config: AgentConfig): Promise<SocialPostInput[]> {
  if (config.social.twitterBearerToken.length === 0) {
    log.warn("No Twitter bearer token configured. Skipping social fetch.");
    return [];
  }

  const executor = await findExecutor(clients.publicClient, CAPABILITY.HTTP_CALL);
  const query = `(${config.social.twitterSearchTerms.join(" OR ")}) -is:retweet lang:en`;
  const url =
    "https://api.twitter.com/2/tweets/search/recent" +
    `?query=${encodeURIComponent(query)}` +
    "&max_results=50" +
    "&tweet.fields=public_metrics,created_at,referenced_tweets,attachments" +
    "&expansions=author_id,attachments.media_keys" +
    "&user.fields=username" +
    "&media.fields=type";

  const bundle = await buildSecretBundle(clients.walletClient, clients.account, executor.publicKey, {
    TWITTER_BEARER_TOKEN: config.social.twitterBearerToken,
  });

  const response = await callHttp(clients, {
    executor: executor.teeAddress,
    url,
    method: HTTP_METHOD.GET,
    headerKeys: ["Authorization", "Accept"],
    headerValues: ["Bearer TWITTER_BEARER_TOKEN", "application/json"],
    encryptedSecrets: bundle.encryptedSecrets,
    secretSignatures: bundle.secretSignatures,
  });

  if (response.errorMessage.length > 0) {
    throw new Error(`Twitter fetch executor error: ${response.errorMessage}`);
  }
  if (response.statusCode >= 400) {
    throw new Error(`Twitter API returned ${response.statusCode}: ${response.body.slice(0, 200)}`);
  }

  return parseTwitterResponse(response.body);
}

function parseTwitterResponse(body: string): SocialPostInput[] {
  let parsed: TwitterSearchResponse;
  try {
    parsed = JSON.parse(body) as TwitterSearchResponse;
  } catch {
    log.warn("Failed to parse Twitter response body.");
    return [];
  }

  const users = new Map<string, string>();
  for (const user of parsed.includes?.users ?? []) {
    users.set(user.id, user.username);
  }
  const videoKeys = new Set<string>();
  for (const media of parsed.includes?.media ?? []) {
    if (media.type === "video" || media.type === "animated_gif") {
      videoKeys.add(media.media_key);
    }
  }

  return (parsed.data ?? []).map((tweet) => {
    const isThread = (tweet.referenced_tweets ?? []).some((ref) => ref.type === "replied_to");
    const hasVideo = (tweet.attachments?.media_keys ?? []).some((mediaKey) => videoKeys.has(mediaKey));
    return {
      id: tweet.id,
      author: tweet.author_id !== undefined ? (users.get(tweet.author_id) ?? tweet.author_id) : "unknown",
      text: tweet.text,
      impressions: tweet.public_metrics?.impression_count ?? 0,
      isThread,
      hasVideo,
      createdAt: tweet.created_at ?? new Date().toISOString(),
    };
  });
}
