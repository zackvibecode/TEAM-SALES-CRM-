import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getAdminSalesClickPerformance } from "@/lib/admin/sales-click-performance";

export interface LeaderboardRow {
  id: string;
  name: string;
  total: number;
  clicked: number;
  pending: number;
  followUp: number;
}

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

    const clickResult = await getAdminSalesClickPerformance(db, {
      startDate: "2000-01-01",
      endDate: todayDateString(),
      sortBy: "highest",
    });

    const clickByUser = new Map(
      clickResult.rows.map((row) => [row.sales_user_id, row.total_clicks])
    );

    const rows: LeaderboardRow[] = await Promise.all(
      salesProfiles.map(async (sp) => {
        const [
          { count: total },
          { count: pending },
          { count: followUp },
        ] = await Promise.all([
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id),
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Pending"),
          db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Follow Up"),
        ]);

        return {
          id: sp.id,
          name: sp.full_name,
          total: total ?? 0,
          clicked: clickByUser.get(sp.id) ?? 0,
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
