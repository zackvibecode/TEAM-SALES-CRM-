import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { fileId, newOwnerUserId, adminId } = await request.json();
    if (!fileId || !newOwnerUserId) {
      return NextResponse.json({ error: "Missing fileId or newOwnerUserId" }, { status: 400 });
    }

    const db = createDbClient();

    const { data: file, error: fileErr } = await db
      .from("uploaded_files")
      .select("owner_user_id, campaign_name, file_name")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const oldOwner = file.owner_user_id;

    await db.from("uploaded_files").update({ owner_user_id: newOwnerUserId }).eq("id", fileId);
    await db.from("leads").update({ owner_user_id: newOwnerUserId }).eq("source_file_id", fileId);

    if (adminId) {
      await logAudit({
        actorId: adminId,
        action: "reassign_batch",
        entityType: "uploaded_files",
        entityId: fileId,
        details: { oldOwner, newOwner: newOwnerUserId, file_name: file.file_name },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reassign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
