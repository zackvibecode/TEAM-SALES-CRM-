import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getFollowUpKpis, updateOverdueFollowUps } from "@/lib/follow-up/service";

export async function GET() {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const db = createDbClient();
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    const role = (profile?.role as "admin" | "sales") ?? "sales";

    await updateOverdueFollowUps(db);

    const kpis = await getFollowUpKpis(db, {
      role,
      userId: role === "sales" ? user.id : undefined,
    });

    return NextResponse.json({ kpis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load KPIs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
