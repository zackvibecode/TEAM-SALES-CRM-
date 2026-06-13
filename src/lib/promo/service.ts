import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/auth-context";
import { normalizeDepartureEntries, syncPromoEndsAt } from "@/lib/promo/countdown";
import type { Promo, PromoActivityAction, PromoDepartureEntry, PromoInput } from "@/types/promo";

const PROMO_SELECT =
  "*, creator:created_by(full_name, email), updater:updated_by(full_name, email)";

export function canModifyPromo(
  role: UserRole,
  userId: string,
  promo: { created_by: string }
): boolean {
  return role === "admin" || promo.created_by === userId;
}

export async function listPromos(
  db: SupabaseClient,
  opts?: { activeOnly?: boolean; limit?: number }
) {
  let query = db.from("promos").select(PROMO_SELECT).order("sort_order", { ascending: false });

  if (opts?.activeOnly) {
    query = query.eq("is_active", true);
  }

  query = query.order("created_at", { ascending: false });

  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Promo[];
}

export async function getPromoById(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("promos").select(PROMO_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Promo | null;
}

export async function logPromoActivity(
  db: SupabaseClient,
  params: {
    promoId: string | null;
    actorId: string;
    action: PromoActivityAction;
    changes?: Record<string, unknown>;
  }
) {
  await db.from("promo_activity_logs").insert({
    promo_id: params.promoId,
    actor_id: params.actorId,
    action: params.action,
    changes: params.changes ?? {},
  });
}

function normalizeInputDepartures(input: PromoInput): PromoDepartureEntry[] {
  if (Array.isArray(input.departure_dates)) {
    return input.departure_dates.filter((entry) => entry.date);
  }
  if (input.ends_at) return [{ name: input.title?.trim() || "", date: input.ends_at }];
  return [];
}

function snapshotPromo(promo: Promo | PromoInput & { id?: string }) {
  const departure_dates =
    "departure_dates" in promo && Array.isArray(promo.departure_dates)
      ? normalizeInputDepartures(promo as PromoInput)
      : normalizeDepartureEntries(promo as Promo);
  return {
    title: promo.title,
    promo_text: promo.promo_text,
    poster_url: promo.poster_url ?? null,
    is_active: promo.is_active ?? true,
    sort_order: promo.sort_order ?? 0,
    ends_at: promo.ends_at ?? null,
    departure_dates,
    destination: promo.destination ?? null,
    seats_left: promo.seats_left ?? 0,
    image_url: promo.image_url ?? null,
  };
}

function buildPromoRow(input: PromoInput) {
  const departure_dates = normalizeInputDepartures(input);
  const firstName = departure_dates.find((entry) => entry.name)?.name;
  return {
    title: input.title.trim() || firstName || "Package",
    promo_text: input.promo_text.trim(),
    poster_url: input.poster_url ?? null,
    is_active: input.is_active !== false,
    sort_order: input.sort_order ?? 0,
    departure_dates,
    ends_at: syncPromoEndsAt(departure_dates),
    destination: input.destination ?? null,
    seats_left: input.seats_left ?? 0,
    image_url: input.image_url ?? null,
  };
}

export async function createPromo(
  db: SupabaseClient,
  userId: string,
  input: PromoInput
) {
  const row = {
    ...buildPromoRow(input),
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await db.from("promos").insert(row).select(PROMO_SELECT).single();
  if (error) throw error;

  await logPromoActivity(db, {
    promoId: data.id,
    actorId: userId,
    action: "created",
    changes: { after: snapshotPromo(data as Promo) },
  });

  return data as Promo;
}

export async function updatePromo(
  db: SupabaseClient,
  userId: string,
  id: string,
  input: Partial<PromoInput>
) {
  const existing = await getPromoById(db, id);
  if (!existing) return null;

  const updates: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.promo_text !== undefined) updates.promo_text = input.promo_text.trim();
  if (input.poster_url !== undefined) updates.poster_url = input.poster_url;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
  if (input.destination !== undefined) updates.destination = input.destination;
  if (input.seats_left !== undefined) updates.seats_left = input.seats_left;
  if (input.image_url !== undefined) updates.image_url = input.image_url;

  if (input.departure_dates !== undefined || input.ends_at !== undefined) {
    const departure_dates = normalizeInputDepartures({
      title: input.title ?? existing.title,
      promo_text: input.promo_text ?? existing.promo_text,
      departure_dates:
        input.departure_dates ?? normalizeDepartureEntries(existing),
      ends_at: input.ends_at,
    });
    updates.departure_dates = departure_dates;
    updates.ends_at = syncPromoEndsAt(departure_dates);
    if (!input.title) {
      const firstName = departure_dates.find((entry) => entry.name)?.name;
      if (firstName) updates.title = firstName;
    }
  }

  const { data, error } = await db
    .from("promos")
    .update(updates)
    .eq("id", id)
    .select(PROMO_SELECT)
    .single();

  if (error) throw error;

  await logPromoActivity(db, {
    promoId: id,
    actorId: userId,
    action: "updated",
    changes: {
      before: snapshotPromo(existing),
      after: snapshotPromo(data as Promo),
    },
  });

  return data as Promo;
}

export async function deletePromo(db: SupabaseClient, userId: string, id: string) {
  const existing = await getPromoById(db, id);
  if (!existing) return false;

  await logPromoActivity(db, {
    promoId: id,
    actorId: userId,
    action: "deleted",
    changes: { before: snapshotPromo(existing) },
  });

  const { error } = await db.from("promos").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function listPromoActivity(
  db: SupabaseClient,
  opts?: { promoId?: string; limit?: number }
) {
  let query = db
    .from("promo_activity_logs")
    .select("*, actor:actor_id(full_name, email)")
    .order("created_at", { ascending: false });

  if (opts?.promoId) {
    query = query.eq("promo_id", opts.promoId);
  }

  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
