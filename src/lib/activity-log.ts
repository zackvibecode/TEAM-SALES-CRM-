import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsAppRateLimitWarningOutcome } from "@/lib/follow-up/types";
import { WHATSAPP_RATE_LIMIT } from "@/lib/whatsapp-rate-limit";

export const WHATSAPP_ACTIVITY_TYPES = ["whatsapp_clicked", "follow_up_clicked"] as const;
export const WHATSAPP_RATE_LIMIT_WARNING_TYPE = "whatsapp_rate_limit_warning" as const;

export interface ActivityLogItem {
  id: string;
  sales_name: string;
  lead_name: string;
  lead_whatsapp: string;
  created_at: string;
}

export interface WhatsAppWarningLogItem {
  id: string;
  sales_name: string;
  lead_name: string;
  lead_whatsapp: string;
  click_count: number;
  outcome: WhatsAppRateLimitWarningOutcome;
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

export async function fetchWhatsAppRateLimitWarnings(
  db: SupabaseClient,
  opts: { salesUserId?: string; limit?: number } = {}
): Promise<WhatsAppWarningLogItem[]> {
  const limit = opts.limit ?? 500;

  let query = db
    .from("activity_logs")
    .select("id, sales_user_name, created_at, metadata, lead: lead_id (name, whatsapp)")
    .eq("action_type", WHATSAPP_RATE_LIMIT_WARNING_TYPE)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.salesUserId) {
    query = query.eq("sales_user_id", opts.salesUserId);
  }

  const { data } = await query;

  return (data ?? []).map((a) => {
    const lead = Array.isArray(a.lead) ? a.lead[0] : a.lead;
    const metadata = (a.metadata ?? {}) as Record<string, unknown>;
    const outcome = metadata.outcome as WhatsAppRateLimitWarningOutcome | undefined;

    return {
      id: a.id,
      sales_name: a.sales_user_name || "Unknown",
      lead_name: (lead as { name?: string } | null)?.name || "Unknown",
      lead_whatsapp:
        (metadata.lead_whatsapp as string | undefined) ||
        (lead as { whatsapp?: string } | null)?.whatsapp ||
        "",
      click_count: Number(metadata.click_count ?? WHATSAPP_RATE_LIMIT.maxClicks),
      outcome: outcome ?? "shown",
      created_at: a.created_at,
    };
  });
}

export async function logWhatsAppRateLimitWarning(
  db: SupabaseClient,
  params: {
    leadId: string;
    userId: string;
    userName: string;
    phone: string;
    clickCount: number;
    clickedFrom: "lead_card" | "follow_up_queue";
    outcome: WhatsAppRateLimitWarningOutcome;
    warningLogId?: string;
  }
): Promise<{ id: string }> {
  if (params.warningLogId && params.outcome !== "shown") {
    const { data: existing } = await db
      .from("activity_logs")
      .select("metadata")
      .eq("id", params.warningLogId)
      .eq("sales_user_id", params.userId)
      .single();

    const metadata = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      outcome: params.outcome,
    };

    await db
      .from("activity_logs")
      .update({ metadata })
      .eq("id", params.warningLogId)
      .eq("sales_user_id", params.userId);

    return { id: params.warningLogId };
  }

  const message =
    params.outcome === "shown"
      ? `Rate limit warning shown (${params.clickCount} clicks in ${WHATSAPP_RATE_LIMIT.windowMinutes} min)`
      : `Rate limit warning: user chose to ${params.outcome}`;

  const { data, error } = await db
    .from("activity_logs")
    .insert({
      lead_id: params.leadId,
      sales_user_id: params.userId,
      sales_user_name: params.userName,
      action_type: WHATSAPP_RATE_LIMIT_WARNING_TYPE,
      message,
      metadata: {
        click_count: params.clickCount,
        max_clicks: WHATSAPP_RATE_LIMIT.maxClicks,
        window_minutes: WHATSAPP_RATE_LIMIT.windowMinutes,
        lead_whatsapp: params.phone,
        clicked_from: params.clickedFrom,
        outcome: params.outcome,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to log rate limit warning");
  }

  return { id: data.id };
}
