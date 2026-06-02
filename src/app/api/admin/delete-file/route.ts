import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { fileId, adminId } = await request.json();
    if (!fileId) return NextResponse.json({ error: "No fileId" }, { status: 400 });

    const db = createDbClient();
    await db.from("leads").delete().eq("source_file_id", fileId);
    await db.from("uploaded_files").delete().eq("id", fileId);

    if (adminId) {
      await logAudit({
        actorId: adminId,
        action: "delete_file",
        entityType: "uploaded_files",
        entityId: fileId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
