import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import { nameToSlug } from "@/lib/agent/sales-monitor";
import { getPics } from "@/lib/sales-follow-up/service";
import { createDbClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Active Sales Follow-Up PICs for Hermes filters. */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const db = createDbClient();
    const pics = await getPics(db);
    return NextResponse.json({
      pics: pics.map((p) => ({
        id: p.id,
        name: p.name,
        slug: nameToSlug(p.name),
        email: p.email,
        phone: p.phone,
        status: p.status,
      })),
      count: pics.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list PICs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
