import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/admin-auth";

const CONFIRM_PHRASE = "RESET ALL";

/** Delete all rows in a table (service role). */
async function deleteAll(db: ReturnType<typeof createDbClient>, table: string) {
  const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { user, db } = authResult;

    const { confirmPhrase } = await request.json();
    if (confirmPhrase !== CONFIRM_PHRASE) {
      return NextResponse.json(
        { error: `Type exactly "${CONFIRM_PHRASE}" to confirm` },
        { status: 400 }
      );
    }

    await deleteAll(db, "activity_logs");
    await deleteAll(db, "follow_ups");
    await deleteAll(db, "lead_activities");
    await deleteAll(db, "leads");
    await deleteAll(db, "uploaded_files");
    await deleteAll(db, "audit_logs");

    await logAudit({
      actorId: user!.id,
      action: "reset_all_crm_data",
      entityType: "system",
      entityId: "all",
      details: { scope: "leads, files, activities, audit" },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reset failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
