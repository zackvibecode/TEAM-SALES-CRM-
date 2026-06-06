import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import {
  getAdminSalesClickPerformance,
  resolveSalesClickDateRange,
  type SalesClickDatePreset,
} from "@/lib/admin/sales-click-performance";

export async function GET(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get("preset") || "week") as SalesClickDatePreset;
    const customStart = searchParams.get("startDate") ?? undefined;
    const customEnd = searchParams.get("endDate") ?? undefined;

    const range = resolveSalesClickDateRange(preset, customStart, customEnd);
    const db = createDbClient();

    const result = await getAdminSalesClickPerformance(db, {
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy: "highest",
    });

    return NextResponse.json({
      preset,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load leaderboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
