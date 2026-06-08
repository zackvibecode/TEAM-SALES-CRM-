import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { getProfileName, logWhatsAppClick } from "@/lib/follow-up/service";

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const leadId = String(body.leadId || "");
    const clickedFrom =
      body.clickedFrom === "follow_up_queue" ? "follow_up_queue" : "lead_card";

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const db = createDbClient();
    const { data: lead, error: fetchError } = await db
      .from("leads")
      .select("id, owner_user_id, whatsapp")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "You can only update your own leads" }, { status: 403 });
    }

    const userName = await getProfileName(db, user.id);
    const { lead: updated, counted } = await logWhatsAppClick(db, {
      leadId,
      userId: user.id,
      userName,
      clickedFrom,
      phone: lead.whatsapp,
    });

    const wa = formatWhatsAppNumber(lead.whatsapp);

    return NextResponse.json({
      success: true,
      counted,
      lead: updated,
      whatsapp: wa,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
