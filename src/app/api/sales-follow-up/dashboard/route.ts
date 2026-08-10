import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getDashboardStats, listPackagesWithCounts } from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scoped = await resolveScopedPicId(
    ctx.db,
    ctx.role,
    ctx.user.id,
    searchParams.get("picId")
  );
  if (scoped.error) {
    return NextResponse.json({ error: scoped.error }, { status: 403 });
  }

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: scoped.picId,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
    search: searchParams.get("search") || undefined,
    followUpFilter: (searchParams.get("followUpFilter") as FollowUpFilterParams["followUpFilter"]) || "all",
    packageFilter: searchParams.get("packageFilter") || undefined,
  };

  try {
    const stats = await getDashboardStats(ctx.db, filters);
    let packages: Awaited<ReturnType<typeof listPackagesWithCounts>> = [];
    try {
      packages = await listPackagesWithCounts(ctx.db, filters);
    } catch {
      // Package list must not break dashboard for any user
      packages = [];
    }
    return NextResponse.json({ ...stats, packages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
