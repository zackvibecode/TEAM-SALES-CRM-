import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { leadId } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const db = createDbClient();
    const { data: lead, error: fetchError } = await db
      .from("leads")
      .select("id, owner_user_id, status, whatsapp")
      .eq("id", leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.owner_user_id !== user.id) {
      return NextResponse.json({ error: "You can only update your own leads" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const oldStatus = lead.status;

    const { data: updated, error: updateError } = await db
      .from("leads")
      .update({
        status: "Clicked",
        clicked_at: now,
        clicked_by: user.id,
        updated_at: now,
      })
      .eq("id", leadId)
      .select("id, status, clicked_at, updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await db.from("lead_activities").insert({
      lead_id: leadId,
      sales_user_id: user.id,
      activity_type: "whatsapp_clicked",
      old_status: oldStatus,
      new_status: "Clicked",
    });

    const wa = formatWhatsAppNumber(lead.whatsapp);

    return NextResponse.json({
      success: true,
      lead: updated,
      whatsapp: wa,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
