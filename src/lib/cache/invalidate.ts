import { cacheDel, cacheDelByPrefix } from "./cached";
import { CACHE_PREFIX, cacheKeys } from "./keys";

/**
 * Call after any lead mutation (status, WhatsApp click, reassign, upload).
 * Clears shared aggregates + the affected user's lead list.
 * Never throws — Redis failures are swallowed.
 */
export async function invalidateLeadCaches(options?: {
  userId?: string;
  userIds?: string[];
}): Promise<void> {
  const userIds = new Set<string>();
  if (options?.userId) userIds.add(options.userId);
  for (const id of options?.userIds ?? []) userIds.add(id);

  const deletes: Promise<void>[] = [
    cacheDel(cacheKeys.leaderboard()),
    cacheDelByPrefix(CACHE_PREFIX.clickPerf),
    cacheDelByPrefix(CACHE_PREFIX.adminDashboard),
    cacheDelByPrefix("crm:v1:sales-dashboard:"),
  ];

  for (const id of userIds) {
    deletes.push(cacheDel(cacheKeys.myLeads(id)));
  }

  await Promise.all(deletes);
}

/** Call after rotator click / page / member changes. */
export async function invalidateRotatorCaches(): Promise<void> {
  await cacheDelByPrefix(CACHE_PREFIX.rotatorAnalytics);
}
