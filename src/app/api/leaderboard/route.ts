import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";

export interface LeaderboardRow {
  id: string;
  name: string;
  total: number;
  clicked: number;
  pending: number;
  followUp: number;
}

export async function GET() {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDbClient();

    const { data: salesProfiles } = await db
      .from("profiles")
      .select("id, full_name")
      .eq("role", "sales");

    if (!salesProfiles?.length) {
      return NextResponse.json({ rows: [] });
    }

    const rows: LeaderboardRow[] = await Promise.all(
      salesProfiles.map(async (sp) => {
        const [
          { count: total },
          { count: clicked },
          { count: pending },
          { count: followUp },
        ] = await Promise.all([
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id),
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Clicked"),
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Pending"),
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Follow Up"),
        ]);

        return {
          id: sp.id,
          name: sp.full_name,
          total: total ?? 0,
          clicked: clicked ?? 0,
          pending: pending ?? 0,
          followUp: followUp ?? 0,
        };
      })
    );

    return NextResponse.json({ rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
