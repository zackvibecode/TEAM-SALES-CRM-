import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAdminSalesClickPerformance,
  resolveSalesClickDateRange,
  type SalesClickDatePreset,
  type SalesClickSortKey,
} from "@/lib/admin/sales-click-performance";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get("preset") || "today") as SalesClickDatePreset;
    const sortBy = (searchParams.get("sort") || "highest") as SalesClickSortKey;
    const customStart = searchParams.get("startDate") ?? undefined;
    const customEnd = searchParams.get("endDate") ?? undefined;

    const range = resolveSalesClickDateRange(preset, customStart, customEnd);

    const result = await getAdminSalesClickPerformance(auth.db, {
      startDate: range.startDate,
      endDate: range.endDate,
      sortBy,
    });

    return NextResponse.json({
      preset,
      sortBy,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load click performance";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
