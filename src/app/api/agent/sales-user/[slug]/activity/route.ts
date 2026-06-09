import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  getSalesUserActivity,
  parseLimitParam,
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
    const limit = parseLimitParam(searchParams.get("limit"));

    const db = createDbClient();
    const salesUser = await resolveSalesUserBySlug(db, slug);
    if (!salesUser) {
      return NextResponse.json({ error: `Sales user not found: ${slug}` }, { status: 404 });
    }

    const activities = await getSalesUserActivity(db, salesUser.id, limit);
    return NextResponse.json({
      sales_user: salesUser,
      activities,
      count: activities.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
