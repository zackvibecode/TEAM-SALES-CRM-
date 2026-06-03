import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
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
