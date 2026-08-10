import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  parseAgentLimit,
  parseSfuFiltersFromSearchParams,
  resolveAgentPicId,
  slimLead,
} from "@/lib/agent/sfu-query";
import { getLeads } from "@/lib/sales-follow-up/service";
import { createDbClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Sales Follow-Up leads list for Hermes / agents. */
export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = request.nextUrl;
    const db = createDbClient();
    const pic = await resolveAgentPicId(db, {
      picId: searchParams.get("picId"),
      pic: searchParams.get("pic") || searchParams.get("picSlug"),
    });
    if (pic.error) {
      return NextResponse.json({ error: pic.error }, { status: 404 });
    }

    const filters = parseSfuFiltersFromSearchParams(searchParams, pic.picId);
    const limit = parseAgentLimit(searchParams.get("limit"), 50, 200);
    const leads = await getLeads(db, filters);
    const sliced = leads.slice(0, limit).map(slimLead);

    return NextResponse.json({
      leads: sliced,
      count: sliced.length,
      total_matched: leads.length,
      truncated: leads.length > limit,
      filters: {
        ...filters,
        pic_name: pic.pic?.name ?? null,
        limit,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list leads";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
