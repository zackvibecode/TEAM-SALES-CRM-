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

/** Prefer PIC already linked to this user, then any with user_id, then oldest. */
function pickBestPic(rows: SalesPic[], preferredUserId?: string): SalesPic | null {
  if (rows.length === 0) return null;
  if (preferredUserId) {
    const linked = rows.find((r) => r.user_id === preferredUserId);
    if (linked) return linked;
  }
  const withUser = rows.find((r) => !!r.user_id);
  if (withUser) return withUser;
  return [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))[0] ?? null;
}

/**
 * Resolve the PIC record for a sales user.
 * Match order: sales_pics.user_id → email → full_name (case-insensitive).
 * Auto-links user_id when matched by name/email.
 * Creates a PIC from profile only if no matching active PIC exists.
 */
export async function resolvePicForSalesUser(
  db: DbClient,
  userId: string
): Promise<SalesPic | null> {
  const profile = await getProfileForFollowUp(db, userId);
  if (!profile) return null;

  // 1) Direct user_id link (may have duplicates — pick one)
  {
    const { data: byUserId } = await db
      .from("sales_pics")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(10);

    const picked = pickBestPic((byUserId ?? []) as SalesPic[], userId);
    if (picked) return picked;
  }

  // 2) Match by email
  if (profile.email) {
    const { data: byEmail } = await db
      .from("sales_pics")
      .select("*")
      .ilike("email", profile.email)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(10);

    const picked = pickBestPic((byEmail ?? []) as SalesPic[], userId);
    if (picked) {
      await tryLinkPicUser(db, picked.id, userId);
      return { ...picked, user_id: userId };
    }
  }

  // 3) Match by full name (case/whitespace-insensitive) — never auto-create if match exists
  const name = profile.full_name?.trim() || profile.email?.split("@")[0] || "Sales User";
  if (name) {
    const { data: activePics } = await db
      .from("sales_pics")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(200);

    const nameKey = name.trim().toLowerCase().replace(/\s+/g, " ");
    const nameMatches = ((activePics ?? []) as SalesPic[]).filter(
      (p) => (p.name ?? "").trim().toLowerCase().replace(/\s+/g, " ") === nameKey
    );
    const picked = pickBestPic(nameMatches, userId);
    if (picked) {
      await tryLinkPicUser(db, picked.id, userId);
      return { ...picked, user_id: userId };
    }
  }

  // 4) Auto-create only when no active PIC matches
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

  // Race: another request may have created the same name — link that row
  {
    const { data: raceRows } = await db
      .from("sales_pics")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(200);

    const nameKey = name.trim().toLowerCase().replace(/\s+/g, " ");
    const nameMatches = ((raceRows ?? []) as SalesPic[]).filter(
      (p) => (p.name ?? "").trim().toLowerCase().replace(/\s+/g, " ") === nameKey
    );
    const picked = pickBestPic(nameMatches, userId);
    if (picked) {
      await tryLinkPicUser(db, picked.id, userId);
      return { ...picked, user_id: userId };
    }
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
      error: "PIC_NOT_LINKED",
    };
  }

  return { picId: pic.id, pic };
}

/**
 * Fast access check for delete — prefer user_id link only (1 query),
 * fall back to full PIC resolve only if needed.
 */
export async function assertLeadAccessFast(
  db: DbClient,
  role: UserRole,
  userId: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (role === "admin") return { ok: true };

  const [{ data: picsByUser }, { data: lead }] = await Promise.all([
    db
      .from("sales_pics")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10),
    db
      .from("sales_leads")
      .select("id, assigned_pic_id")
      .eq("id", leadId)
      .maybeSingle(),
  ]);

  if (!lead) {
    return { ok: false, error: "LEAD_NOT_FOUND", status: 404 };
  }

  const picIds = (picsByUser ?? []).map((p) => p.id as string);
  if (picIds.length > 0) {
    if (!lead.assigned_pic_id || !picIds.includes(lead.assigned_pic_id)) {
      return { ok: false, error: "LEAD_FORBIDDEN", status: 403 };
    }
    return { ok: true };
  }

  // Rare path: PIC linked by email/name only
  return assertLeadAccess(db, role, userId, leadId);
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
    return { ok: false, error: "LEAD_NOT_FOUND", status: 404 };
  }

  if (lead.assigned_pic_id !== scoped.picId) {
    return {
      ok: false,
      error: "LEAD_FORBIDDEN",
      status: 403,
    };
  }

  return { ok: true };
}
