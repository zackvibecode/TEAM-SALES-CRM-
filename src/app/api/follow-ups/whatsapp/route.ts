import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { followUpViaWhatsApp, getProfileName } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { followUpId } = await request.json();
    if (!followUpId) return NextResponse.json({ error: "Missing followUpId" }, { status: 400 });

    const db = createDbClient();
    const { data: fu } = await db
      .from("follow_ups")
      .select("id, sales_user_id, lead:lead_id(whatsapp, owner_user_id)")
      .eq("id", followUpId)
      .single();

    if (!fu) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const leadRaw = fu.lead as { whatsapp: string; owner_user_id: string } | { whatsapp: string; owner_user_id: string }[];
    const lead = Array.isArray(leadRaw) ? leadRaw[0] : leadRaw;
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userName = await getProfileName(db, user.id);
    const result = await followUpViaWhatsApp(db, {
      followUpId,
      userId: user.id,
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
