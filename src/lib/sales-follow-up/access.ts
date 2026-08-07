import type { createDbClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth-context";
import type { SalesPic } from "./types";

type DbClient = ReturnType<typeof createDbClient>;

export async function getProfileForFollowUp(
  db: DbClient,
  userId: string
): Promise<{ id: string; full_name: string | null; email: string | null; role: string | null } | null> {
  const { data } = await db
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Resolve the PIC record for a sales user.
 * Match order: sales_pics.user_id → email → full_name (case-insensitive).
 * Auto-links user_id when matched by name/email.
 * Creates a PIC from profile if none exists.
 */
export async function resolvePicForSalesUser(
  db: DbClient,
  userId: string
): Promise<SalesPic | null> {
  const profile = await getProfileForFollowUp(db, userId);
  if (!profile) return null;

  // 1) Direct user_id link
  {
    const { data: byUserId, error } = await db
      .from("sales_pics")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!error && byUserId) return byUserId as SalesPic;
  }

  // 2) Match by email
  if (profile.email) {
    const { data: byEmail } = await db
      .from("sales_pics")
      .select("*")
      .ilike("email", profile.email)
      .eq("status", "active")
      .maybeSingle();

    if (byEmail) {
      await tryLinkPicUser(db, byEmail.id, userId);
      return { ...(byEmail as SalesPic), user_id: userId };
    }
  }

  // 3) Match by full name
  if (profile.full_name?.trim()) {
    const { data: byName } = await db
      .from("sales_pics")
      .select("*")
      .ilike("name", profile.full_name.trim())
      .eq("status", "active")
      .maybeSingle();

    if (byName) {
      await tryLinkPicUser(db, byName.id, userId);
      return { ...(byName as SalesPic), user_id: userId };
    }
  }

  // 4) Auto-create PIC from profile so sales can use the module immediately
  const name = profile.full_name?.trim() || profile.email?.split("@")[0] || "Sales User";
  const insertPayload: Record<string, unknown> = {
    name,
    email: profile.email,
    status: "active",
  };

  const withUser = await db
    .from("sales_pics")
    .insert({ ...insertPayload, user_id: userId })
    .select("*")
    .single();

  if (!withUser.error && withUser.data) {
    return withUser.data as SalesPic;
  }

  const withoutUser = await db
    .from("sales_pics")
    .insert(insertPayload)
    .select("*")
    .single();

  if (withoutUser.error || !withoutUser.data) return null;
  return withoutUser.data as SalesPic;
}

async function tryLinkPicUser(db: DbClient, picId: string, userId: string) {
  try {
    await db.from("sales_pics").update({ user_id: userId }).eq("id", picId);
  } catch {
    // Column may not exist yet.
  }
}

export async function resolveScopedPicId(
  db: DbClient,
  role: UserRole,
  userId: string,
  requestedPicId?: string | null
): Promise<{ picId?: string; pic: SalesPic | null; error?: string }> {
  if (role === "admin") {
    return { picId: requestedPicId || undefined, pic: null };
  }

  const pic = await resolvePicForSalesUser(db, userId);
  if (!pic) {
    return {
      pic: null,
      error: "Akaun sales belum dipautkan kepada PIC. Hubungi admin.",
    };
  }

  return { picId: pic.id, pic };
}

export async function assertLeadAccess(
  db: DbClient,
  role: UserRole,
  userId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (role === "admin") return { ok: true };

  const scoped = await resolveScopedPicId(db, role, userId);
  if (!scoped.picId) {
    return { ok: false, error: scoped.error || "Unauthorized", status: 403 };
  }

  const { data: lead } = await db
    .from("sales_leads")
    .select("id, assigned_pic_id")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) {
    return { ok: false, error: "Lead tidak dijumpai.", status: 404 };
  }

  if (lead.assigned_pic_id !== scoped.picId) {
    return {
      ok: false,
      error: "Anda hanya boleh akses lead yang assigned kepada anda.",
      status: 403,
    };
  }

  return { ok: true };
}
