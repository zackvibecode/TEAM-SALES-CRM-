import { getRedis } from "./redis";

/**
 * Cache-aside helper: try Redis → on miss/error run fetcher → store result.
 * Guarantees data always comes from the database when Redis is unavailable
 * or fails — never throws due to Redis errors alone.
 */
export async function cachedGet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await redis.get<T>(key);
      if (hit !== null && hit !== undefined) {
        return hit;
      }
    } catch {
      // Fall through to DB — Redis must never break the app
    }
  }

  const data = await fetcher();

  if (redis) {
    try {
      await redis.set(key, data, { ex: ttlSeconds });
    } catch {
      // Ignore write failures — response still returns fresh DB data
    }
  }

  return data;
}

/** Delete one or more keys. Safe no-op if Redis is off or fails. */
export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    if (keys.length === 1) {
      await redis.del(keys[0]);
    } else {
      await redis.del(...keys);
    }
  } catch {
    // ignore
  }
}

/**
 * Delete all keys matching a prefix (e.g. click-perf:*).
 * Uses SCAN so it works on Upstash without blocking.
 */
export async function cacheDelByPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    let cursor: number | string = 0;
    do {
      const result = (await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      })) as [string | number, string[]];
      const nextCursor = result[0];
      const keys = result[1];
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0 && cursor !== "0");
  } catch {
    // ignore
  }
}
