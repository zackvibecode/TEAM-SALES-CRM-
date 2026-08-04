/** Shared cache key prefixes — bump version suffix to bust all keys after schema changes. */

export const CACHE_TTL = {
  /** Shared leaderboard / click aggregates */
  SHORT: 45,
  /** Admin dashboard / rotator analytics */
  MEDIUM: 60,
  /** Per-user lead lists (invalidated on write) */
  LEADS: 30,
} as const;

export const cacheKeys = {
  leaderboard: () => "crm:v1:leaderboard",
  salesClickPerformance: (startDate: string, endDate: string, sortBy: string) =>
    `crm:v1:click-perf:${startDate}:${endDate}:${sortBy}`,
  adminDashboard: (dayKey: string) => `crm:v1:admin-dashboard:${dayKey}`,
  rotatorAnalytics: (filterHash: string) => `crm:v1:rotator-analytics:${filterHash}`,
  myLeads: (userId: string) => `crm:v1:my-leads:${userId}`,
} as const;

/** Prefixes used for bulk invalidation via SCAN (Upstash supports scan). */
export const CACHE_PREFIX = {
  leaderboard: "crm:v1:leaderboard",
  clickPerf: "crm:v1:click-perf:",
  adminDashboard: "crm:v1:admin-dashboard:",
  rotatorAnalytics: "crm:v1:rotator-analytics:",
  myLeads: "crm:v1:my-leads:",
} as const;
