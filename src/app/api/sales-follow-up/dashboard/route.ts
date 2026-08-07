import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/sales-follow-up/service";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: searchParams.get("picId") || undefined,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
    search: searchParams.get("search") || undefined,
    followUpFilter: (searchParams.get("followUpFilter") as FollowUpFilterParams["followUpFilter"]) || "all",
  };

  try {
    const stats = await getDashboardStats(ctx.db, filters);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
