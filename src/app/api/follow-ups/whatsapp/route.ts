import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { followUpViaWhatsApp, getProfileName } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { followUpId } = await request.json();
    if (!followUpId) return NextResponse.json({ error: "Missing followUpId" }, { status: 400 });

    const { data: fu } = await ctx.db
      .from("follow_ups")
      .select("id, sales_user_id, lead:lead_id(whatsapp, owner_user_id)")
      .eq("id", followUpId)
      .single();

    if (!fu) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const leadRaw = fu.lead as { whatsapp: string; owner_user_id: string } | { whatsapp: string; owner_user_id: string }[];
    const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (ctx.role !== "admin" && lead.owner_user_id !== ctx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actingUserId = ctx.role === "admin" ? fu.sales_user_id : ctx.user.id;
    const userName = await getProfileName(ctx.db, actingUserId);
    const result = await followUpViaWhatsApp(ctx.db, {
      followUpId,
      userId: actingUserId,
      userName,
      phone: lead.whatsapp,
    });

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      followUpNumber: result.followUpNumber,
      whatsapp: formatWhatsAppNumber(lead.whatsapp),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
