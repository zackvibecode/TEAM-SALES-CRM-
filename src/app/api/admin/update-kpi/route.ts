import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { userId, kpiMonthlyClicks, kpiMonthlyConverts, adminId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const db = createDbClient();
    await db
      .from("profiles")
      .update({
        kpi_monthly_clicks: kpiMonthlyClicks ?? null,
        kpi_monthly_converts: kpiMonthlyConverts ?? null,
      })
      .eq("id", userId);

    if (adminId) {
      await logAudit({
        actorId: adminId,
        action: "update_kpi",
        entityType: "profiles",
        entityId: userId,
        details: { kpiMonthlyClicks, kpiMonthlyConverts },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
