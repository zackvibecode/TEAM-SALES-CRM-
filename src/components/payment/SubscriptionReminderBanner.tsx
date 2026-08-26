"use client";

import Link from "next/link";
import { AlertTriangle, Ban } from "lucide-react";
import type { SubscriptionReminder } from "@/types/payment";

const DISMISS_KEY = "zaqone-sub-reminder-dismiss";

function dismissKey(reminder: SubscriptionReminder) {
  return `${reminder.kind}:${reminder.daysRemaining}`;
}

export function isReminderDismissed(reminder: SubscriptionReminder): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { key: string; until: number };
    if (parsed.key !== dismissKey(reminder)) return false;
    return Date.now() < parsed.until;
  } catch {
    return false;
  }
}

export function dismissReminder(reminder: SubscriptionReminder) {
  // Dismiss until next calendar day (avoid popup spam)
  const until = new Date();
  until.setHours(23, 59, 59, 999);
  localStorage.setItem(
    DISMISS_KEY,
    JSON.stringify({ key: dismissKey(reminder), until: until.getTime() })
  );
}

export function SubscriptionReminderBanner({
  reminder,
  onDismiss,
}: {
  reminder: SubscriptionReminder;
  onDismiss?: () => void;
}) {
  const isExpired = reminder.kind === "expired";
  const Icon = isExpired ? Ban : AlertTriangle;

  return (
    <div
      className="surface-card card-padded flex flex-col sm:flex-row sm:items-center gap-3 border"
      style={{
        borderColor: isExpired
          ? "color-mix(in srgb, var(--color-error-500) 35%, var(--border-color))"
          : "color-mix(in srgb, var(--color-warning-500) 35%, var(--border-color))",
        background: isExpired
          ? "color-mix(in srgb, var(--color-error-50) 80%, var(--surface-card))"
          : "color-mix(in srgb, var(--color-warning-50) 80%, var(--surface-card))",
      }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="mt-0.5 shrink-0 rounded-lg p-2"
          style={{
            background: isExpired
              ? "var(--color-error-50)"
              : "var(--color-warning-50)",
            color: isExpired
              ? "var(--color-error-600)"
              : "var(--color-warning-600)",
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {isExpired ? "Subscription Expired" : "Subscription Expiring Soon"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {reminder.message}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={reminder.ctaHref} className="btn-primary-solid text-sm">
          {reminder.ctaLabel}
        </Link>
        {onDismiss && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
