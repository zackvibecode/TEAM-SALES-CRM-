import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getProfileName, markFollowUpCompleted } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { followUpId } = await request.json();
    if (!followUpId) return NextResponse.json({ error: "Missing followUpId" }, { status: 400 });

    const { data: fu } = await ctx.db
      .from("follow_ups")
      .select("lead_id, sales_user_id")
      .eq("id", followUpId)
      .single();

    if (!fu) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (ctx.role !== "admin" && fu.sales_user_id !== ctx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actingUserId = ctx.role === "admin" ? fu.sales_user_id : ctx.user.id;
    const userName = await getProfileName(ctx.db, actingUserId);

    await markFollowUpCompleted(ctx.db, {
      followUpId,
      userId: actingUserId,
      userName,
      updateLeadStatus: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
