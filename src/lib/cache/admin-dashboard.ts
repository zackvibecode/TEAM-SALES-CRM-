import type { SupabaseClient } from "@supabase/supabase-js";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_TTL, cacheKeys } from "@/lib/cache/keys";

export interface AdminDashboardPerformanceRow {
  id: string;
  full_name: string;
  email: string;
  total_data: number;
  clicked: number;
  pending: number;
  followUp: number;
  interested: number;
  notInterested: number;
  noResponse: number;
  converted: number;
  today_clicks: number;
  this_week_clicks: number;
  progress: number;
}

export interface AdminDashboardAggregateStats {
  salesUsers: number;
  files: number;
  leads: number;
  clicked: number;
  pending: number;
  clicksToday: number;
  clicksWeek: number;
}

export interface AdminDashboardPayload {
  salesProfiles: { id: string; full_name: string; email: string; role: string }[];
  performanceData: AdminDashboardPerformanceRow[];
  aggregateStats: AdminDashboardAggregateStats;
}

type LeadRow = {
  owner_user_id: string | null;
  status: string | null;
  clicked_at: string | null;
};

async function loadAllLeadStats(db: SupabaseClient): Promise<LeadRow[]> {
  const all: LeadRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await db
      .from("leads")
      .select("owner_user_id, status, clicked_at")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...(data as LeadRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function fetchAdminDashboard(db: SupabaseClient): Promise<AdminDashboardPayload> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - now.getDay());
  const weekStart = weekStartDate.toISOString();

  const [
    { count: salesUsers },
    { count: files },
    { data: salesProfiles },
    leads,
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }).in("role", ["sales", "admin"]),
    db.from("uploaded_files").select("*", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["sales", "admin"])
      .order("full_name"),
    loadAllLeadStats(db),
  ]);

  const profiles = salesProfiles || [];

  let totalLeads = 0;
  let totalClicked = 0;
  let totalPending = 0;
  let clicksToday = 0;
  let clicksWeek = 0;

  const byOwner = new Map<
    string,
    {
      total: number;
      clicked: number;
      pending: number;
      followUp: number;
      interested: number;
      notInterested: number;
      noResponse: number;
      converted: number;
      today: number;
      week: number;
    }
  >();

  for (const lead of leads) {
    totalLeads += 1;
    const status = lead.status ?? "";
    if (status === "Clicked") totalClicked += 1;
    if (status === "Pending") totalPending += 1;
    if (status === "Clicked" && lead.clicked_at && lead.clicked_at >= todayStart) {
      clicksToday += 1;
    }
    if (status === "Clicked" && lead.clicked_at && lead.clicked_at >= weekStart) {
      clicksWeek += 1;
    }

    const ownerId = lead.owner_user_id;
    if (!ownerId) continue;

    let entry = byOwner.get(ownerId);
    if (!entry) {
      entry = {
        total: 0,
        clicked: 0,
        pending: 0,
        followUp: 0,
        interested: 0,
        notInterested: 0,
        noResponse: 0,
        converted: 0,
        today: 0,
        week: 0,
      };
      byOwner.set(ownerId, entry);
    }

    entry.total += 1;
    if (status === "Clicked") entry.clicked += 1;
    if (status === "Pending") entry.pending += 1;
    if (status === "Follow Up") entry.followUp += 1;
    if (status === "Interested") entry.interested += 1;
    if (status === "Not Interested") entry.notInterested += 1;
    if (status === "No Response") entry.noResponse += 1;
    if (status === "Converted") entry.converted += 1;
    if (status === "Clicked" && lead.clicked_at && lead.clicked_at >= todayStart) {
      entry.today += 1;
    }
    if (status === "Clicked" && lead.clicked_at && lead.clicked_at >= weekStart) {
      entry.week += 1;
    }
  }

  const performanceData: AdminDashboardPerformanceRow[] = profiles.map((sp) => {
    const stats = byOwner.get(sp.id) ?? {
      total: 0,
      clicked: 0,
      pending: 0,
      followUp: 0,
      interested: 0,
      notInterested: 0,
      noResponse: 0,
      converted: 0,
      today: 0,
      week: 0,
    };

    return {
      id: sp.id,
      full_name: sp.full_name,
      email: sp.email,
      total_data: stats.total,
      clicked: stats.clicked,
      pending: stats.pending,
      followUp: stats.followUp,
      interested: stats.interested,
      notInterested: stats.notInterested,
      noResponse: stats.noResponse,
      converted: stats.converted,
      today_clicks: stats.today,
      this_week_clicks: stats.week,
      progress: stats.total > 0 ? Math.round((stats.clicked / stats.total) * 100) : 0,
    };
  });

  return {
    salesProfiles: profiles,
    performanceData,
    aggregateStats: {
      salesUsers: salesUsers ?? 0,
      files: files ?? 0,
      leads: totalLeads,
      clicked: totalClicked,
      pending: totalPending,
      clicksToday,
      clicksWeek,
    },
  };
}

/** Day key so "today/week" windows refresh at least daily even if TTL is longer. */
function dashboardDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getCachedAdminDashboard(
  db: SupabaseClient
): Promise<AdminDashboardPayload> {
  return cachedGet(cacheKeys.adminDashboard(dashboardDayKey()), CACHE_TTL.MEDIUM, () =>
    fetchAdminDashboard(db)
  );
}
