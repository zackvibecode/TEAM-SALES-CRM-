import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { fileId } = await request.json();
    if (!fileId) return NextResponse.json({ error: "No fileId" }, { status: 400 });

    const db = auth.db;
    await db.from("leads").delete().eq("source_file_id", fileId);
    await db.from("uploaded_files").delete().eq("id", fileId);

    await logAudit({
      actorId: auth.user.id,
      action: "delete_file",
      entityType: "uploaded_files",
      entityId: fileId,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
