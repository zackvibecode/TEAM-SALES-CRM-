import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPicPerformance, getChartData } from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "performance";

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
  };

  try {
    if (type === "all") {
      const [perfData, chartRes] = await Promise.all([
        getPicPerformance(ctx.db, filters),
        getChartData(ctx.db, filters),
      ]);
      const chartData =
        ctx.role === "sales" && scoped.pic
          ? chartRes.filter((row) => row.pic_name === scoped.pic!.name)
          : chartRes;
      const performance =
        ctx.role === "sales" && scoped.picId
          ? perfData.filter((row) => row.pic_id === scoped.picId)
          : perfData;
      return NextResponse.json({ chartData, performance });
    }

    if (type === "chart") {
      const data = await getChartData(ctx.db, filters);
      const chartData =
        ctx.role === "sales" && scoped.pic
          ? data.filter((row) => row.pic_name === scoped.pic!.name)
          : data;
      return NextResponse.json({ chartData });
    }

    const data = await getPicPerformance(ctx.db, filters);
    const performance =
      ctx.role === "sales" && scoped.picId
        ? data.filter((row) => row.pic_id === scoped.picId)
        : data;
    return NextResponse.json({ performance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch performance data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
