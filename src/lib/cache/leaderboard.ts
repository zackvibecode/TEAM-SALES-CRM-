import type { SupabaseClient } from "@supabase/supabase-js";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_TTL, cacheKeys } from "@/lib/cache/keys";
import { getAdminSalesClickPerformance } from "@/lib/admin/sales-click-performance";

export interface LeaderboardRow {
  id: string;
  name: string;
  total: number;
  clicked: number;
  pending: number;
  followUp: number;
}

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchLeaderboardRows(db: SupabaseClient): Promise<LeaderboardRow[]> {
  const { data: salesProfiles } = await db
    .from("profiles")
    .select("id, full_name")
    .in("role", ["sales", "admin"]);

  if (!salesProfiles?.length) return [];

  const clickResult = await getAdminSalesClickPerformance(db, {
    startDate: "2000-01-01",
    endDate: todayDateString(),
    sortBy: "highest",
  });

  const clickByUser = new Map(
    clickResult.rows.map((row) => [row.sales_user_id, row.total_clicks])
  );

  // One pass over leads instead of 3N count queries
  const statusCounts = new Map<
    string,
    { total: number; pending: number; followUp: number }
  >();

  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await db
      .from("leads")
      .select("owner_user_id, status")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const row of data) {
      const ownerId = row.owner_user_id as string | null;
      if (!ownerId) continue;
      let entry = statusCounts.get(ownerId);
      if (!entry) {
        entry = { total: 0, pending: 0, followUp: 0 };
        statusCounts.set(ownerId, entry);
      }
      entry.total += 1;
      if (row.status === "Pending") entry.pending += 1;
      if (row.status === "Follow Up") entry.followUp += 1;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return salesProfiles.map((sp) => {
    const counts = statusCounts.get(sp.id) ?? { total: 0, pending: 0, followUp: 0 };
    return {
      id: sp.id,
      name: sp.full_name,
      total: counts.total,
      clicked: clickByUser.get(sp.id) ?? 0,
      pending: counts.pending,
      followUp: counts.followUp,
    };
  });
}

export async function getCachedLeaderboard(
  db: SupabaseClient
): Promise<LeaderboardRow[]> {
  return cachedGet(cacheKeys.leaderboard(), CACHE_TTL.SHORT, () =>
    fetchLeaderboardRows(db)
  );
}
