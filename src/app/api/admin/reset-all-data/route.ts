import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const CONFIRM_PHRASE = "RESET ALL";

async function requireAdmin() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const db = createDbClient();
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  const { data: roleRpc } = await db.rpc("get_user_role", { user_id: user.id });
  const role = profile?.role || roleRpc;

  if (role !== "admin") {
    return { error: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }

  return { user, db };
}

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
