import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPicPerformance } from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

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
    let data = await getPicPerformance(ctx.db, filters);
    if (ctx.role === "sales" && scoped.picId) {
      data = data.filter((row) => row.pic_id === scoped.picId);
    }

    if (format === "csv") {
      const headers = [
        "PIC",
        "Leads Assigned",
        "Total Follow-Up Activities",
        "Leads Followed Up",
        "Leads With At Least 3 Follow-Ups",
        "No Follow-Up",
        "Overdue",
        "Completion Rate",
      ];

      const rows = data.map((row) => [
        row.pic_name,
        row.leads_assigned,
        row.total_follow_up_activities,
        row.leads_followed_up,
        row.leads_with_three_plus,
        row.no_follow_up,
        row.overdue,
        `${row.completion_rate}%`,
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="pic-performance-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ performance: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
