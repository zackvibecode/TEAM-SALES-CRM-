import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { userId, kpiMonthlyClicks, kpiMonthlyConverts } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = auth.db;
    await db
      .from("profiles")
      .update({
        kpi_monthly_clicks: kpiMonthlyClicks ?? null,
        kpi_monthly_converts: kpiMonthlyConverts ?? null,
      })
      .eq("id", userId);

    await logAudit({
      actorId: auth.user.id,
      action: "update_kpi",
      entityType: "profiles",
      entityId: userId,
      details: { kpiMonthlyClicks, kpiMonthlyConverts },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
