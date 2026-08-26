import type {
  ReminderTier,
  Subscription,
  SubscriptionReminder,
  SubscriptionStatus,
} from "@/types/payment";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr + (dateStr.includes("T") ? "" : "T23:59:59"));
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY);
  return diff;
}

export function deriveSubscriptionStatus(
  subscription: Pick<Subscription, "status" | "expiry_date" | "start_date"> | null,
  hasPendingPayment: boolean
): SubscriptionStatus {
  if (hasPendingPayment) return "payment_pending";
  if (!subscription) return "unpaid";

  if (subscription.status === "payment_pending") return "payment_pending";
  if (subscription.status === "unpaid") return "unpaid";

  const days = daysUntil(subscription.expiry_date);
  if (days === null) {
    return subscription.status === "active" ? "active" : subscription.status;
  }
  if (days < 0) return "expired";
  if (days <= 7) return "expiring_soon";
  return "active";
}

export function computeExpiryDate(startDate: Date, durationDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + durationDays);
  return d.toISOString().slice(0, 10);
}

export function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPlanPrice(amount: number): string {
  const n = Number(amount);
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.001) {
    return `RM${Math.round(n)}`;
  }
  return `RM${n.toFixed(2)}`;
}

const REMINDER_TIERS: ReminderTier[] = [30, 14, 7, 3, 1];

export function getSubscriptionReminder(
  subscription: Pick<Subscription, "status" | "expiry_date" | "plan_name"> | null
): SubscriptionReminder | null {
  if (!subscription?.expiry_date) return null;

  const days = daysUntil(subscription.expiry_date);
  if (days === null) return null;

  if (days < 0 || subscription.status === "expired") {
    return {
      kind: "expired",
      daysRemaining: days,
      message: `Your ${subscription.plan_name} subscription has expired. Renew your subscription to continue using PRO features.`,
      ctaLabel: "Renew PRO",
      ctaHref: "/payment",
    };
  }

  if (!REMINDER_TIERS.includes(days as ReminderTier)) return null;

  return {
    kind: "expiring",
    daysRemaining: days,
    message: `Your ${subscription.plan_name} subscription will expire in ${days} day${days === 1 ? "" : "s"}.`,
    ctaLabel: "Renew Subscription",
    ctaHref: "/payment",
  };
}

export function canSubmitPaymentWithDays(opts: {
  displayStatus: SubscriptionStatus;
  hasPendingPayment: boolean;
  daysRemaining: number | null;
}): { ok: boolean; reason?: string } {
  if (opts.hasPendingPayment || opts.displayStatus === "payment_pending") {
    return {
      ok: false,
      reason: "You already have a payment pending verification.",
    };
  }
  // Block duplicate only when fully active and more than 7 days left
  if (
    opts.displayStatus === "active" &&
    (opts.daysRemaining === null || opts.daysRemaining > 7)
  ) {
    return {
      ok: false,
      reason: "You already have an active PRO subscription.",
    };
  }
  return { ok: true };
}
