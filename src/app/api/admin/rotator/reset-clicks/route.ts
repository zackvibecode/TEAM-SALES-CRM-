import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

type ResetScope = "all" | "duplicates" | "page";

/** Admin-only: reset rotator click analytics */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const scope = (body.scope as ResetScope) || "all";
    const pageId = (body.pageId as string)?.trim();

    if (scope === "page" && !pageId) {
      return NextResponse.json({ error: "pageId is required for page reset" }, { status: 400 });
    }

    let query = auth.db.from("rotator_clicks").delete({ count: "exact" });

    if (scope === "page") {
      query = query.eq("rotator_page_id", pageId);
    } else if (scope === "duplicates") {
      query = query.eq("is_duplicate", true);
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      scope,
      pageId: pageId || null,
      deleted: count ?? 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reset clicks";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
