import type { SupabaseClient } from "@supabase/supabase-js";

export interface SalesUserListItem {
  id: string;
  full_name: string;
  email: string;
  slug: string;
}

export interface SalesUserSummary {
  sales_user: SalesUserListItem;
  period_days: number;
  active_days_count: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  total_whatsapp_clicks: number;
  total_follow_ups_completed: number;
  daily_follow_up_goal: number;
  kpi_monthly_clicks: number | null;
  kpi_monthly_converts: number | null;
  total_leads: number;
  pending_leads: number;
  today_completed: number;
  goal_reached_today: boolean;
}

export interface SalesActivityItem {
  id: string;
  activity_type: string;
  message: string;
  lead_name: string;
  lead_whatsapp: string;
  created_at: string;
  source: "activity_logs" | "lead_activities";
}

export interface DailyBreakdownRow {
  date: string;
  whatsapp_clicks: number;
  follow_ups_completed: number;
  unique_leads_touched: number;
}

export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function periodStartIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return `${toDateString(d)}T00:00:00.000`;
}

function todayStartISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function listSalesUsers(db: SupabaseClient): Promise<SalesUserListItem[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "sales")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    slug: nameToSlug(row.full_name),
  }));
}

export async function resolveSalesUserBySlug(
  db: SupabaseClient,
  slug: string
): Promise<SalesUserListItem | null> {
  const users = await listSalesUsers(db);
  const normalized = slug.trim().toLowerCase();
  return users.find((u) => u.slug === normalized) ?? null;
}

export async function getSalesUserSummary(
  db: SupabaseClient,
  userId: string,
  days: number
): Promise<SalesUserSummary> {
  const users = await listSalesUsers(db);
  const salesUser = users.find((u) => u.id === userId);
  if (!salesUser) throw new Error("Sales user not found");

  const startIso = periodStartIso(days);
  const todayStart = todayStartISO();

  const [
    { data: profile },
    { count: totalLeads },
    { count: pendingLeads },
    { data: richLogs },
    { data: legacyLogs },
    { data: todayActivities },
  ] = await Promise.all([
    db
      .from("profiles")
      .select("daily_follow_up_goal, kpi_monthly_clicks, kpi_monthly_converts")
      .eq("id", userId)
      .single(),
    db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", userId),
    db
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", userId)
      .eq("status", "Pending"),
    db
      .from("activity_logs")
      .select("action_type, lead_id, created_at")
      .eq("sales_user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
    db
      .from("lead_activities")
      .select("activity_type, lead_id, created_at")
      .eq("sales_user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
    db
      .from("lead_activities")
      .select("lead_id")
      .eq("sales_user_id", userId)
      .gte("created_at", todayStart)
      .in("activity_type", ["whatsapp_clicked", "status_updated"]),
  ]);

  const activeDates = new Set<string>();
  let firstActivity: string | null = null;
  let lastActivity: string | null = null;

  const allTimestamps: string[] = [];
  for (const row of richLogs ?? []) {
    if (row.created_at) allTimestamps.push(row.created_at);
  }
  for (const row of legacyLogs ?? []) {
    if (row.created_at) allTimestamps.push(row.created_at);
  }

  for (const ts of allTimestamps.sort()) {
    const day = ts.slice(0, 10);
    activeDates.add(day);
    if (!firstActivity) firstActivity = day;
    lastActivity = day;
  }

  const seenClicks = new Set<string>();
  let whatsappClicks = 0;
  let followUpsCompleted = 0;

  for (const row of richLogs ?? []) {
    if (row.action_type === "whatsapp_clicked") {
      const dayKey = String(row.created_at ?? "").slice(0, 10);
      const dedupeKey = `${row.lead_id}:${dayKey}`;
      if (!seenClicks.has(dedupeKey)) {
        seenClicks.add(dedupeKey);
        whatsappClicks += 1;
      }
    } else if (row.action_type === "follow_up_completed") {
      followUpsCompleted += 1;
    } else if (row.action_type === "follow_up_clicked") {
      whatsappClicks += 1;
    }
  }

  for (const row of legacyLogs ?? []) {
    if (row.activity_type === "whatsapp_clicked") {
      const dayKey = String(row.created_at ?? "").slice(0, 10);
      const dedupeKey = `${row.lead_id}:${dayKey}`;
      if (!seenClicks.has(dedupeKey)) {
        seenClicks.add(dedupeKey);
        whatsappClicks += 1;
      }
    }
  }

  const todayCompleted = new Set(
    (todayActivities ?? []).map((row) => row.lead_id).filter(Boolean)
  ).size;

  const goal = profile?.daily_follow_up_goal ?? 50;

  return {
    sales_user: salesUser,
    period_days: days,
    active_days_count: activeDates.size,
    first_activity_date: firstActivity,
    last_activity_date: lastActivity,
    total_whatsapp_clicks: whatsappClicks,
    total_follow_ups_completed: followUpsCompleted,
    daily_follow_up_goal: goal,
    kpi_monthly_clicks: profile?.kpi_monthly_clicks ?? null,
    kpi_monthly_converts: profile?.kpi_monthly_converts ?? null,
    total_leads: totalLeads ?? 0,
    pending_leads: pendingLeads ?? 0,
    today_completed: todayCompleted,
    goal_reached_today: todayCompleted >= goal,
  };
}

export async function getSalesUserActivity(
  db: SupabaseClient,
  userId: string,
  limit: number
): Promise<SalesActivityItem[]> {
  const [{ data: rich }, { data: legacy }] = await Promise.all([
    db
      .from("activity_logs")
      .select("id, action_type, message, created_at, lead:lead_id (name, whatsapp)")
      .eq("sales_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("lead_activities")
      .select(
        "id, activity_type, notes, old_status, new_status, created_at, lead:lead_id (name, whatsapp)"
      )
      .eq("sales_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const richItems: SalesActivityItem[] = (rich ?? []).map((a) => {
    const lead = leadFields(a.lead);
    return {
      id: a.id,
      activity_type: a.action_type,
      message: a.message,
      lead_name: lead.name,
      lead_whatsapp: lead.whatsapp,
      created_at: a.created_at,
      source: "activity_logs",
    };
  });

  const legacyItems: SalesActivityItem[] = (legacy ?? []).map((a) => {
    const lead = leadFields(a.lead);
    return {
      id: `legacy-${a.id}`,
      activity_type: a.activity_type,
      message: a.notes || `${a.old_status ?? ""} → ${a.new_status ?? ""}`.trim(),
      lead_name: lead.name,
      lead_whatsapp: lead.whatsapp,
      created_at: a.created_at,
      source: "lead_activities",
    };
  });

  return [...richItems, ...legacyItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function getSalesUserDailyBreakdown(
  db: SupabaseClient,
  userId: string,
  days: number
): Promise<DailyBreakdownRow[]> {
  const startIso = periodStartIso(days);

  const [{ data: richLogs }, { data: legacyLogs }] = await Promise.all([
    db
      .from("activity_logs")
      .select("action_type, lead_id, created_at")
      .eq("sales_user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
    db
      .from("lead_activities")
      .select("activity_type, lead_id, created_at")
      .eq("sales_user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: true }),
  ]);

  const byDay = new Map<
    string,
    { clicks: number; followUps: number; leads: Set<string> }
  >();

  function ensureDay(date: string) {
    let row = byDay.get(date);
    if (!row) {
      row = { clicks: 0, followUps: 0, leads: new Set() };
      byDay.set(date, row);
    }
    return row;
  }

  const seenClicks = new Map<string, Set<string>>();

  for (const row of richLogs ?? []) {
    const day = String(row.created_at ?? "").slice(0, 10);
    if (!day) continue;
    const bucket = ensureDay(day);

    if (row.lead_id) bucket.leads.add(row.lead_id);

    if (row.action_type === "whatsapp_clicked") {
      const dedupeKey = `${row.lead_id}:${day}`;
      let daySet = seenClicks.get(day);
      if (!daySet) {
        daySet = new Set();
        seenClicks.set(day, daySet);
      }
      if (!daySet.has(dedupeKey)) {
        daySet.add(dedupeKey);
        bucket.clicks += 1;
      }
    } else if (row.action_type === "follow_up_clicked") {
      bucket.clicks += 1;
    } else if (row.action_type === "follow_up_completed") {
      bucket.followUps += 1;
    }
  }

  for (const row of legacyLogs ?? []) {
    const day = String(row.created_at ?? "").slice(0, 10);
    if (!day) continue;
    const bucket = ensureDay(day);

    if (row.lead_id) bucket.leads.add(row.lead_id);

    if (row.activity_type === "whatsapp_clicked") {
      const dedupeKey = `${row.lead_id}:${day}`;
      let daySet = seenClicks.get(day);
      if (!daySet) {
        daySet = new Set();
        seenClicks.set(day, daySet);
      }
      if (!daySet.has(dedupeKey)) {
        daySet.add(dedupeKey);
        bucket.clicks += 1;
      }
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      whatsapp_clicks: stats.clicks,
      follow_ups_completed: stats.followUps,
      unique_leads_touched: stats.leads.size,
    }));
}

export function parseDaysParam(value: string | null, fallback = 30): number {
  const n = parseInt(value ?? "", 10);
  if (!n || n < 1) return fallback;
  return Math.min(n, 365);
}

function leadFields(lead: unknown): { name: string; whatsapp: string } {
  if (!lead || typeof lead !== "object") return { name: "Unknown", whatsapp: "" };
  const row = lead as { name?: string; whatsapp?: string };
  return {
    name: row.name ?? "Unknown",
    whatsapp: row.whatsapp ?? "",
  };
}

export function parseLimitParam(value: string | null, fallback = 50): number {
  const n = parseInt(value ?? "", 10);
  if (!n || n < 1) return fallback;
  return Math.min(n, 200);
}
