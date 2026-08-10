import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import {
  parseSfuFiltersFromSearchParams,
  resolveAgentPicId,
} from "@/lib/agent/sfu-query";
import { getDashboardStats, listPackagesWithCounts } from "@/lib/sales-follow-up/service";
import { createDbClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Sales Follow-Up dashboard / report stats for Hermes. */
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
    const [stats, packages] = await Promise.all([
      getDashboardStats(db, filters),
      listPackagesWithCounts(db, filters),
    ]);

    return NextResponse.json({
      stats,
      packages,
      filters: {
        ...filters,
        pic_name: pic.pic?.name ?? null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load dashboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
