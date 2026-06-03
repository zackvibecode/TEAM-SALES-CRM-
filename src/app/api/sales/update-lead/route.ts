import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types";

function parseFollowUpAt(value: unknown): string | null {
  if (value == null || value === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

const VALID_STATUSES: LeadStatus[] = [
  "Pending",
  "Clicked",
  "Follow Up",
  "Interested",
  "Not Interested",
  "No Response",
  "Converted",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { leadId, status, notes, followUpAt } = await request.json();
    if (!leadId || !status) {
      return NextResponse.json({ error: "Missing leadId or status" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = createDbClient();
    const { data: lead, error: fetchError } = await db
      .from("leads")
      .select("id, owner_user_id, status")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldStatus = lead.status;
    const now = new Date().toISOString();
    const parsedFollowUpAt = parseFollowUpAt(followUpAt);
    if (followUpAt != null && followUpAt !== "" && parsedFollowUpAt === null) {
      return NextResponse.json({ error: "Invalid followUpAt date" }, { status: 400 });
    }

    const { data: updated, error: updateError } = await db
      .from("leads")
      .update({
        status,
        notes: notes ?? "",
        follow_up_at: parsedFollowUpAt,
        updated_at: now,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await db.from("lead_activities").insert({
      lead_id: leadId,
      sales_user_id: user.id,
      activity_type: "status_updated",
      old_status: oldStatus,
      new_status: status,
      notes: notes || null,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
