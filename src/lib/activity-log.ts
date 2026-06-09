import type { SupabaseClient } from "@supabase/supabase-js";

export const WHATSAPP_ACTIVITY_TYPES = ["whatsapp_clicked", "follow_up_clicked"] as const;

export interface ActivityLogItem {
  id: string;
  sales_name: string;
  lead_name: string;
  lead_whatsapp: string;
  created_at: string;
}

export function formatActivityDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export async function fetchWhatsAppActivityLogs(
  db: SupabaseClient,
  opts: { salesUserId?: string; limit?: number } = {}
): Promise<ActivityLogItem[]> {
  const limit = opts.limit ?? 500;

  let query = db
    .from("activity_logs")
    .select("id, sales_user_name, created_at, lead: lead_id (name, whatsapp)")
    .in("action_type", [...WHATSAPP_ACTIVITY_TYPES])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.salesUserId) {
    query = query.eq("sales_user_id", opts.salesUserId);
  }

  const { data } = await query;

  return (data ?? []).map((a) => {
    const lead = Array.isArray(a.lead) ? a.lead[0] : a.lead;
    return {
      id: a.id,
      sales_name: a.sales_user_name || "Unknown",
      lead_name: (lead as { name?: string } | null)?.name || "Unknown",
      lead_whatsapp: (lead as { whatsapp?: string } | null)?.whatsapp || "",
      created_at: a.created_at,
    };
  });
}

export async function countRecentWhatsAppClicks(
  db: SupabaseClient,
  userId: string,
  windowMinutes: number
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await db
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("sales_user_id", userId)
    .in("action_type", [...WHATSAPP_ACTIVITY_TYPES])
    .gte("created_at", since);

  return count ?? 0;
}
