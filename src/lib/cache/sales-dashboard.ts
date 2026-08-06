import type { SupabaseClient } from "@supabase/supabase-js";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_TTL } from "@/lib/cache/keys";
import { computeBatchStats } from "@/lib/campaign-stats";

export interface SalesDashboardPayload {
  total: number;
  pending: number;
  clicked: number;
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  fullName: string;
  kpiClicks: number | null;
  newBatchCount: number;
  batchCards: {
    id: string;
    label: string;
    source_tag: string | null;
    total: number;
    pending: number;
    progress: number;
    created_at: string;
  }[];
}

async function fetchSalesDashboard(
  db: SupabaseClient,
  userId: string,
): Promise<SalesDashboardPayload> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total },
    { count: pending },
    { count: clicked },
    { count: todayClicks },
    { count: weekClicks },
    { count: monthClicks },
    { data: profile },
    { data: files },
    { data: fileLeads },
    { count: newBatches },
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).eq("status", "Pending"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).eq("status", "Clicked"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).eq("status", "Clicked").gte("clicked_at", todayStart),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).eq("status", "Clicked").gte("clicked_at", sevenDaysAgo),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).eq("status", "Clicked").gte("clicked_at", monthStart),
    db.from("profiles").select("full_name, kpi_monthly_clicks").eq("id", userId).single(),
    db.from("uploaded_files").select("id, campaign_name, file_name, source_tag, is_archived, created_at").eq("owner_user_id", userId).order("created_at", { ascending: false }),
    db.from("leads").select("source_file_id, status").eq("owner_user_id", userId),
    db.from("uploaded_files").select("*", { count: "exact", head: true }).eq("owner_user_id", userId).gte("created_at", sevenDaysAgo),
  ]);

  const statsByFile = new Map<string, { status: string }[]>();
  for (const row of fileLeads || []) {
    if (!row.source_file_id) continue;
    const list = statsByFile.get(row.source_file_id) || [];
    list.push({ status: row.status });
    statsByFile.set(row.source_file_id, list);
  }

  const batchCards = (files || [])
    .filter((f) => !(f.is_archived ?? false))
    .map((f) => {
      const stats = computeBatchStats(statsByFile.get(f.id) || []);
      return {
        id: f.id,
        label: f.campaign_name || f.file_name,
        source_tag: f.source_tag ?? null,
        total: stats.total,
        pending: stats.pending,
        progress: stats.progress,
        created_at: f.created_at,
      };
    });

  return {
    total: total ?? 0,
    pending: pending ?? 0,
    clicked: clicked ?? 0,
    todayClicks: todayClicks ?? 0,
    weekClicks: weekClicks ?? 0,
    monthClicks: monthClicks ?? 0,
    fullName: profile?.full_name || "Sales User",
    kpiClicks: profile?.kpi_monthly_clicks ?? null,
    newBatchCount: newBatches ?? 0,
    batchCards,
  };
}

function dayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getCachedSalesDashboard(
  db: SupabaseClient,
  userId: string,
): Promise<SalesDashboardPayload> {
  const key = `crm:v1:sales-dashboard:${userId}:${dayKey()}`;
  return cachedGet(key, CACHE_TTL.MEDIUM, () => fetchSalesDashboard(db, userId));
}
