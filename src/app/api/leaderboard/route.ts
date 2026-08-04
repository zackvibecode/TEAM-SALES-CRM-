import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { getCachedLeaderboard, type LeaderboardRow } from "@/lib/cache/leaderboard";

export type { LeaderboardRow };

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
    const rows = await getCachedLeaderboard(db);

    return NextResponse.json({ rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
