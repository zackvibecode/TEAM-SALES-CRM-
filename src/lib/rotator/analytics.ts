import type { SupabaseClient } from "@supabase/supabase-js";
import type { RotatorAnalyticsFilters } from "@/types/rotator";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export async function getRotatorAnalytics(
  db: SupabaseClient,
  filters: RotatorAnalyticsFilters = {}
) {
  let query = db.from("rotator_clicks").select("*");

  if (filters.startDate) query = query.gte("clicked_at", filters.startDate);
  if (filters.endDate) query = query.lte("clicked_at", `${filters.endDate}T23:59:59.999Z`);
  if (filters.pageId) query = query.eq("rotator_page_id", filters.pageId);
  if (filters.salesMemberId) query = query.eq("sales_member_id", filters.salesMemberId);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.campaign) query = query.eq("campaign", filters.campaign);

  const { data: clicks, error } = await query.order("clicked_at", { ascending: false });
  if (error) throw error;

  const all = clicks || [];
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const weekStart = startOfWeek(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();

  const totalClicks = all.length;
  const uniqueClicks = all.filter((c) => !c.is_duplicate).length;
  const duplicateClicks = all.filter((c) => c.is_duplicate).length;
  const todayClicks = all.filter((c) => c.clicked_at >= todayStart).length;
  const weekClicks = all.filter((c) => c.clicked_at >= weekStart).length;
  const monthClicks = all.filter((c) => c.clicked_at >= monthStart).length;

  return {
    totalClicks,
    uniqueClicks,
    duplicateClicks,
    todayClicks,
    weekClicks,
    monthClicks,
    clicks: all,
  };
}

export async function getPageClickStats(db: SupabaseClient, pageIds: string[]) {
  if (!pageIds.length) return {};

  const { data, error } = await db
    .from("rotator_clicks")
    .select("rotator_page_id, is_duplicate")
    .in("rotator_page_id", pageIds);

  if (error) throw error;

  const stats: Record<string, { total: number; unique: number }> = {};
  for (const row of data || []) {
    if (!stats[row.rotator_page_id]) stats[row.rotator_page_id] = { total: 0, unique: 0 };
    stats[row.rotator_page_id].total++;
    if (!row.is_duplicate) stats[row.rotator_page_id].unique++;
  }
  return stats;
}

export async function getSalesClickStats(db: SupabaseClient, memberIds: string[]) {
  if (!memberIds.length) return {};

  const { data, error } = await db
    .from("rotator_clicks")
    .select("sales_member_id, is_duplicate")
    .in("sales_member_id", memberIds);

  if (error) throw error;

  const stats: Record<string, { total: number; unique: number; duplicate: number }> = {};
  for (const row of data || []) {
    if (!row.sales_member_id) continue;
    if (!stats[row.sales_member_id]) {
      stats[row.sales_member_id] = { total: 0, unique: 0, duplicate: 0 };
    }
    stats[row.sales_member_id].total++;
    if (row.is_duplicate) stats[row.sales_member_id].duplicate++;
    else stats[row.sales_member_id].unique++;
  }
  return stats;
}
