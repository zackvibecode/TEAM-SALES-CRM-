import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";

function todayStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function GET() {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDbClient();
    const todayStart = todayStartISO();

    const [
      { data: profile },
      { count: total },
      { count: pending },
      { data: todayActivities },
    ] = await Promise.all([
      db
        .from("profiles")
        .select("daily_follow_up_goal, full_name")
        .eq("id", user.id)
        .single(),
      db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id),
      db
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("owner_user_id", user.id)
        .eq("status", "Pending"),
      db
        .from("lead_activities")
        .select("lead_id")
        .eq("sales_user_id", user.id)
        .gte("created_at", todayStart)
        .in("activity_type", ["whatsapp_clicked", "status_updated"]),
    ]);

    const todayDone = new Set(
      (todayActivities ?? []).map((row) => row.lead_id).filter(Boolean)
    ).size;

    const goal = profile?.daily_follow_up_goal ?? 50;

    return NextResponse.json({
      goal,
      todayCompleted: todayDone,
      totalLeads: total ?? 0,
      pendingLeads: pending ?? 0,
      goalReached: todayDone >= goal,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { goal } = await request.json();
    const n = parseInt(String(goal), 10);
    if (!n || n < 1 || n > 500) {
      return NextResponse.json({ error: "Goal must be between 1 and 500" }, { status: 400 });
    }

    const db = createDbClient();
    const { error } = await db
      .from("profiles")
      .update({ daily_follow_up_goal: n })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, goal: n });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
