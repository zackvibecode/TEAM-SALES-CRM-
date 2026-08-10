import { nameToSlug } from "@/lib/agent/sales-monitor";
import { getPics } from "@/lib/sales-follow-up/service";
import type { FollowUpFilterParams, LeadStatus, SalesPic } from "@/lib/sales-follow-up/types";
import type { createDbClient } from "@/lib/supabase/server";

type DbClient = ReturnType<typeof createDbClient>;

const LEAD_STATUSES = new Set<LeadStatus>([
  "New",
  "Follow-Up",
  "Interested",
  "KIV",
  "No Response",
  "Not Interested",
  "Booked",
  "Closed",
]);

const FOLLOW_UP_FILTERS = new Set<NonNullable<FollowUpFilterParams["followUpFilter"]>>([
  "all",
  "0",
  "1",
  "2",
  "3+",
  "overdue",
  "due_today",
  "not_today",
]);

export function parseAgentLimit(value: string | null, fallback = 50, max = 200): number {
  const n = parseInt(value ?? "", 10);
  if (!n || n < 1) return fallback;
  return Math.min(n, max);
}

export async function resolveAgentPicId(
  db: DbClient,
  opts: { picId?: string | null; pic?: string | null }
): Promise<{ picId?: string; pic?: SalesPic | null; error?: string }> {
  const picId = opts.picId?.trim();
  if (picId) {
    const pics = await getPics(db);
    const found = pics.find((p) => p.id === picId) ?? null;
    if (!found) return { error: `PIC not found for picId: ${picId}` };
    return { picId: found.id, pic: found };
  }

  const picQuery = opts.pic?.trim();
  if (!picQuery) return { picId: undefined, pic: null };

  const pics = await getPics(db);
  const needle = picQuery.toLowerCase();
  const slugNeedle = nameToSlug(picQuery);
  const found =
    pics.find((p) => p.name.trim().toLowerCase() === needle) ||
    pics.find((p) => nameToSlug(p.name) === slugNeedle) ||
    pics.find((p) => p.name.trim().toLowerCase().includes(needle)) ||
    null;

  if (!found) return { error: `PIC not found for pic: ${picQuery}` };
  return { picId: found.id, pic: found };
}

export function parseSfuFiltersFromSearchParams(
  searchParams: URLSearchParams,
  picId?: string
): FollowUpFilterParams {
  const statusRaw = searchParams.get("status")?.trim();
  const status =
    statusRaw && LEAD_STATUSES.has(statusRaw as LeadStatus)
      ? (statusRaw as LeadStatus)
      : undefined;

  const fuRaw =
    searchParams.get("followUpFilter")?.trim() ||
    searchParams.get("queue")?.trim() ||
    "all";

  let followUpFilter: FollowUpFilterParams["followUpFilter"] = "all";
  if (fuRaw === "no_follow_up") followUpFilter = "0";
  else if (FOLLOW_UP_FILTERS.has(fuRaw as NonNullable<FollowUpFilterParams["followUpFilter"]>)) {
    followUpFilter = fuRaw as FollowUpFilterParams["followUpFilter"];
  }

  return {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId,
    status,
    search: searchParams.get("search") || undefined,
    followUpFilter,
    packageFilter: searchParams.get("packageFilter") || undefined,
  };
}

export function slimLead(lead: {
  id: string;
  customer_name: string;
  phone_number: string;
  destination_or_product: string;
  source: string;
  assigned_pic_id: string | null;
  lead_status: string;
  latest_response: string;
  next_follow_up_date: string | null;
  total_follow_ups: number;
  created_at: string;
  updated_at: string;
  last_follow_up_date?: string | null;
  last_follow_up_at?: string | null;
  assigned_pic?: { id: string; name: string } | null;
}) {
  return {
    id: lead.id,
    customer_name: lead.customer_name,
    phone_number: lead.phone_number,
    package: lead.destination_or_product,
    source: lead.source,
    assigned_pic_id: lead.assigned_pic_id,
    assigned_pic_name: lead.assigned_pic?.name ?? null,
    lead_status: lead.lead_status,
    latest_response: lead.latest_response,
    next_follow_up_date: lead.next_follow_up_date,
    total_follow_ups: lead.total_follow_ups,
    last_follow_up_date: lead.last_follow_up_date ?? null,
    last_follow_up_at: lead.last_follow_up_at ?? null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  };
}
