import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPicPerformance, getChartData } from "@/lib/sales-follow-up/service";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "performance";

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: searchParams.get("picId") || undefined,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
  };

  try {
    if (type === "chart") {
      const data = await getChartData(ctx.db, filters);
      return NextResponse.json({ chartData: data });
    }
    const data = await getPicPerformance(ctx.db, filters);
    return NextResponse.json({ performance: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch performance data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
