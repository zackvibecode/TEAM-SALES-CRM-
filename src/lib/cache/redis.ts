import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

/**
 * Returns Upstash Redis client when env is configured.
 * Returns null when missing — callers must fall back to the database.
 * Never throws on missing config.
 */
export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redis = null;
    return redis;
  }

  try {
    redis = new Redis({ url, token });
  } catch {
    redis = null;
  }

  return redis;
}

export function isRedisEnabled(): boolean {
  return getRedis() !== null;
}
