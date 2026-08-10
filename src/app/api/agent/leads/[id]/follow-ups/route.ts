import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import { getLeadById, getLeadFollowUps } from "@/lib/sales-follow-up/service";
import { createDbClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Follow-up history for one Sales Follow-Up lead. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAgentAuth(_request);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await context.params;
    const db = createDbClient();
    const lead = await getLeadById(db, id);
    if (!lead) {
      return NextResponse.json({ error: `Lead not found: ${id}` }, { status: 404 });
    }
    const followUps = await getLeadFollowUps(db, id);
    return NextResponse.json({
      lead: {
        id: lead.id,
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        lead_status: lead.lead_status,
        total_follow_ups: lead.total_follow_ups,
        next_follow_up_date: lead.next_follow_up_date,
        assigned_pic_name: lead.assigned_pic?.name ?? null,
      },
      follow_ups: followUps,
      count: followUps.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load follow-ups";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
