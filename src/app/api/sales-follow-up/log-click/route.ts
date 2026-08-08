import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getProfileForFollowUp } from "@/lib/sales-follow-up/access";

export async function POST(request: NextRequest) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lead_id, phone } = (await request.json()) as {
    lead_id: string;
    phone: string;
  };

  if (!lead_id) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  const profile = await getProfileForFollowUp(ctx.db, ctx.user.id);
  const salesUserName = profile?.full_name ?? ctx.user.email ?? "Unknown";

  const { error } = await ctx.db.from("activity_logs").insert({
    lead_id,
    sales_user_id: ctx.user.id,
    sales_user_name: salesUserName,
    action_type: "follow_up_clicked",
    message: "Follow-Up button clicked",
    metadata: { phone: phone ?? "", source: "sales_follow_up_table" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
