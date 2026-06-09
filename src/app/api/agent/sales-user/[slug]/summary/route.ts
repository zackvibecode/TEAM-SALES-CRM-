import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  getSalesUserSummary,
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

    const summary = await getSalesUserSummary(db, salesUser.id, days);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load summary";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
