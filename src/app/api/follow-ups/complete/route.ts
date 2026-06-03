import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getProfileName, markFollowUpCompleted } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { followUpId } = await request.json();
    if (!followUpId) return NextResponse.json({ error: "Missing followUpId" }, { status: 400 });

    const db = createDbClient();
    const userName = await getProfileName(db, user.id);

    const { data: fu } = await db
      .from("follow_ups")
      .select("lead_id, sales_user_id")
      .eq("id", followUpId)
      .single();

    if (!fu) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && fu.sales_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await markFollowUpCompleted(db, {
      followUpId,
      userId: user.id,
      userName,
      updateLeadStatus: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
