import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const { fileId, archived, adminId } = await request.json();
    if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

    const db = createDbClient();
    await db
      .from("uploaded_files")
      .update({ is_archived: archived !== false })
      .eq("id", fileId);

    if (adminId) {
      await logAudit({
        actorId: adminId,
        action: "archive_batch",
        entityType: "uploaded_files",
        entityId: fileId,
        details: { archived: archived !== false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Archive failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
