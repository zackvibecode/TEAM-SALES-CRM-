import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  parseAgentLimit,
  parseSfuFiltersFromSearchParams,
  resolveAgentPicId,
  slimLead,
} from "@/lib/agent/sfu-query";
import { getLeads } from "@/lib/sales-follow-up/service";
import { createDbClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Follow-up queue for Hermes.
 * Defaults to due_today. Use ?queue=overdue|due_today|not_today|no_follow_up|all
 */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = request.nextUrl;
    const db = createDbClient();
    const pic = await resolveAgentPicId(db, {
      picId: searchParams.get("picId"),
      pic: searchParams.get("pic") || searchParams.get("picSlug"),
    });
    if (pic.error) {
      return NextResponse.json({ error: pic.error }, { status: 404 });
    }

    // Default queue = due_today when neither queue nor followUpFilter provided
    const hasQueue = Boolean(searchParams.get("queue") || searchParams.get("followUpFilter"));
    const filters = parseSfuFiltersFromSearchParams(searchParams, pic.picId);
    if (!hasQueue) {
      filters.followUpFilter = "due_today";
    }
    const limit = parseAgentLimit(searchParams.get("limit"), 50, 200);
    const leads = await getLeads(db, filters);
    const queue = leads.slice(0, limit).map(slimLead);

    return NextResponse.json({
      follow_ups: queue,
      queue: filters.followUpFilter ?? "due_today",
      count: queue.length,
      total_matched: leads.length,
      truncated: leads.length > limit,
      filters: {
        ...filters,
        pic_name: pic.pic?.name ?? null,
        limit,
      },
      hint: "Each item is a lead due for follow-up. For history of one lead: GET /api/agent/leads/{id}/follow-ups",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list follow-ups";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
