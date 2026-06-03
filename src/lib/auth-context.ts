import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "sales";

export async function resolveUserRole(
  db: ReturnType<typeof createDbClient>,
  userId: string
): Promise<UserRole | null> {
  const { data: profile } = await db.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role === "admin" || profile?.role === "sales") {
    return profile.role;
  }

  const { data: roleRpc } = await db.rpc("get_user_role", { user_id: userId });
  if (roleRpc === "admin" || roleRpc === "sales") {
    return roleRpc;
  }

  return null;
}

export async function getAuthenticatedContext() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const role = await resolveUserRole(db, user.id);
  if (!role) return null;

  return { user, role, db };
}

/** Sales user to attribute CRM actions when an admin acts on someone else's lead. */
export function resolveActingSalesUserId(
  role: UserRole,
  sessionUserId: string,
  leadOwnerUserId: string
) {
  return role === "admin" ? leadOwnerUserId : sessionUserId;
}
