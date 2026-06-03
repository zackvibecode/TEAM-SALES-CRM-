import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getProfileName, scheduleNextFollowUp } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { leadId, followUpDate, note } = await request.json();
    if (!leadId || !followUpDate) {
      return NextResponse.json({ error: "Missing leadId or followUpDate" }, { status: 400 });
    }

    const db = createDbClient();
    const { data: lead } = await db
      .from("leads")
      .select("owner_user_id")
      .eq("id", leadId)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userName = await getProfileName(db, user.id);
    const row = await scheduleNextFollowUp(db, {
      leadId,
      userId: user.id,
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
