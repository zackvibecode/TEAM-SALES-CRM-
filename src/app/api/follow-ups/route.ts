import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import type { FollowUpFilterTab } from "@/lib/follow-up/dates";
import type { FollowUpSortKey } from "@/lib/follow-up/types";
import { getFollowUps, updateOverdueFollowUps } from "@/lib/follow-up/service";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await updateOverdueFollowUps(ctx.db);

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") || "today") as FollowUpFilterTab;
    const sort = (searchParams.get("sort") || "follow_up_date") as FollowUpSortKey;
    const salesUser = searchParams.get("salesUser") ?? undefined;
    const customDate = searchParams.get("customDate") ?? undefined;

    const rows = await getFollowUps(ctx.db, {
      role: ctx.role,
      userId: ctx.user.id,
      filter,
      customDate,
      salesUserFilter: salesUser,
      sort,
    });

    return NextResponse.json({ followUps: rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load follow ups";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
