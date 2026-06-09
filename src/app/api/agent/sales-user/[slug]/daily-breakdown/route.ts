import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  getSalesUserDailyBreakdown,
  parseDaysParam,
  resolveSalesUserBySlug,
} from "@/lib/agent/sales-monitor";
import { createDbClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const days = parseDaysParam(searchParams.get("days"));

    const db = createDbClient();
    const salesUser = await resolveSalesUserBySlug(db, slug);
    if (!salesUser) {
      return NextResponse.json({ error: `Sales user not found: ${slug}` }, { status: 404 });
    }

    const breakdown = await getSalesUserDailyBreakdown(db, salesUser.id, days);
    return NextResponse.json({
      sales_user: salesUser,
      period_days: days,
      days: breakdown,
      active_days_count: breakdown.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load daily breakdown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
