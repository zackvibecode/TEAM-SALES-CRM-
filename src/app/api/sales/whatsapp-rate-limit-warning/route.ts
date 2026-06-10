import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getProfileName } from "@/lib/follow-up/service";
import { logWhatsAppRateLimitWarning } from "@/lib/activity-log";
import type { WhatsAppRateLimitWarningOutcome } from "@/lib/follow-up/types";

const VALID_OUTCOMES: WhatsAppRateLimitWarningOutcome[] = ["shown", "wait", "continue"];

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body.leadId || "");
    const clickCount = Number(body.clickCount ?? 0);
    const outcome = body.outcome as WhatsAppRateLimitWarningOutcome;
    const warningLogId = body.warningLogId ? String(body.warningLogId) : undefined;
    const clickedFrom =
      body.clickedFrom === "follow_up_queue" ? "follow_up_queue" : "lead_card";

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }
    if (!VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }

    const db = createDbClient();
    const { data: lead, error: fetchError } = await db
      .from("leads")
      .select("id, owner_user_id, whatsapp")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "You can only log warnings for your own leads" }, { status: 403 });
    }

    const userName = await getProfileName(db, user.id);
    const result = await logWhatsAppRateLimitWarning(db, {
      leadId,
      userId: user.id,
      userName,
      phone: lead.whatsapp,
      clickCount,
      clickedFrom,
      outcome,
      warningLogId,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Log failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
