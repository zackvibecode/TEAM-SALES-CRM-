import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext, resolveActingSalesUserId } from "@/lib/auth-context";
import { getProfileName, scheduleNextFollowUp } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { leadId, followUpDate, note } = await request.json();
    if (!leadId || !followUpDate) {
      return NextResponse.json({ error: "Missing leadId or followUpDate" }, { status: 400 });
    }

    const parsedDate = new Date(String(followUpDate));
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid followUpDate" }, { status: 400 });
    }

    const { data: lead } = await ctx.db
      .from("leads")
      .select("owner_user_id")
      .eq("id", leadId)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (ctx.role !== "admin" && lead.owner_user_id !== ctx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actingUserId = resolveActingSalesUserId(ctx.role, ctx.user.id, lead.owner_user_id);
    const userName = await getProfileName(ctx.db, actingUserId);
    const row = await scheduleNextFollowUp(ctx.db, {
      leadId,
      userId: actingUserId,
      userName,
      followUpDate: String(followUpDate),
      note: note ?? null,
    });

    return NextResponse.json({ success: true, followUp: row });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
