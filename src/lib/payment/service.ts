import type { createDbClient } from "@/lib/supabase/server";
import type { PaymentSettings, Subscription } from "@/types/payment";
import {
  computeExpiryDate,
  daysUntil,
  deriveSubscriptionStatus,
} from "./subscription";

type Db = ReturnType<typeof createDbClient>;

export async function getPaymentSettings(db: Db): Promise<PaymentSettings> {
  const { data, error } = await db
    .from("payment_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      id: "",
      plan_name: "PRO",
      plan_price: 150,
      subscription_duration_days: 30,
      bank_name: "",
      bank_account_name: "",
      bank_account_number: "",
      qr_code_url: "/IMG_3906.PNG",
      invoice_issuer_name: "MUHAMMAD ZARUL ZAQ'WAN BIN NASARUDDIN",
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...data,
    plan_price: Number(data.plan_price),
  } as PaymentSettings;
}

export async function getLatestSubscription(
  db: Db,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...data, price: Number(data.price) } as Subscription;
}

export async function syncSubscriptionDerivedStatus(
  db: Db,
  subscription: Subscription | null
): Promise<Subscription | null> {
  if (!subscription) return null;
  if (!subscription.expiry_date) return subscription;

  const days = daysUntil(subscription.expiry_date);
  let next = subscription.status;

  if (days !== null && days < 0 && subscription.status !== "expired" && subscription.status !== "unpaid" && subscription.status !== "payment_pending") {
    next = "expired";
  } else if (
    days !== null &&
    days >= 0 &&
    days <= 7 &&
    (subscription.status === "active" || subscription.status === "expiring_soon")
  ) {
    next = "expiring_soon";
  } else if (
    days !== null &&
    days > 7 &&
    (subscription.status === "expiring_soon" || subscription.status === "active")
  ) {
    next = "active";
  }

  if (next !== subscription.status) {
    const { data } = await db
      .from("subscriptions")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", subscription.id)
      .select("*")
      .single();
    if (data) return { ...data, price: Number(data.price) } as Subscription;
  }

  return subscription;
}

export async function hasPendingPayment(db: Db, userId: string): Promise<boolean> {
  const { count, error } = await db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("payment_status", "pending");

  if (error) throw error;
  return (count ?? 0) > 0;
}

export function buildDisplayStatus(
  subscription: Subscription | null,
  pending: boolean
) {
  return deriveSubscriptionStatus(subscription, pending);
}

export async function activateProSubscription(opts: {
  db: Db;
  userId: string;
  planName: string;
  price: number;
  durationDays: number;
  existingSubscriptionId?: string | null;
}): Promise<{ subscription: Subscription; startDate: string; expiryDate: string }> {
  const start = new Date();
  const startDate = start.toISOString().slice(0, 10);
  const expiryDate = computeExpiryDate(start, opts.durationDays);

  // Clear other live rows so unique partial index stays valid
  let expireQuery = opts.db
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", opts.userId)
    .in("status", ["active", "expiring_soon", "payment_pending", "unpaid"]);

  if (opts.existingSubscriptionId) {
    expireQuery = expireQuery.neq("id", opts.existingSubscriptionId);
  }
  await expireQuery;

  if (opts.existingSubscriptionId) {
    const { data, error } = await opts.db
      .from("subscriptions")
      .update({
        plan_name: opts.planName,
        price: opts.price,
        status: "active",
        start_date: startDate,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opts.existingSubscriptionId)
      .select("*")
      .single();
    if (error) throw error;
    return {
      subscription: { ...data, price: Number(data.price) } as Subscription,
      startDate,
      expiryDate,
    };
  }

  const { data, error } = await opts.db
    .from("subscriptions")
    .insert({
      user_id: opts.userId,
      plan_name: opts.planName,
      price: opts.price,
      status: "active",
      start_date: startDate,
      expiry_date: expiryDate,
    })
    .select("*")
    .single();

  if (error) throw error;
  return {
    subscription: { ...data, price: Number(data.price) } as Subscription,
    startDate,
    expiryDate,
  };
}

export async function allocateInvoiceNumber(db: Db): Promise<string> {
  const { data, error } = await db.rpc("next_invoice_number");
  if (error) throw error;
  if (!data || typeof data !== "string") {
    throw new Error("Failed to allocate invoice number");
  }
  return data;
}
