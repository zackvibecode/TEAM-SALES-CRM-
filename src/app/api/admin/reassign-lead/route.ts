import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { leadId, newOwnerUserId } = await request.json();
    if (!leadId || !newOwnerUserId) {
      return NextResponse.json({ error: "Missing leadId or newOwnerUserId" }, { status: 400 });
    }

    const db = auth.db;

    const { data: lead } = await db
      .from("leads")
      .select("owner_user_id, name")
      .eq("id", leadId)
      .single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await db.from("leads").update({ owner_user_id: newOwnerUserId }).eq("id", leadId);

    await logAudit({
      actorId: auth.user.id,
      action: "reassign_lead",
      entityType: "leads",
      entityId: leadId,
      details: { oldOwner: lead.owner_user_id, newOwner: newOwnerUserId, name: lead.name },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reassign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
