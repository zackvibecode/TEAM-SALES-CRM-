"use client";

import { useEffect, useState } from "react";
import {
  SubscriptionReminderBanner,
  dismissReminder,
  isReminderDismissed,
} from "./SubscriptionReminderBanner";
import type { SubscriptionReminder } from "@/types/payment";

/** Lightweight dashboard banner — fetches reminder once, no popups */
export function DashboardSubscriptionBanner() {
  const [reminder, setReminder] = useState<SubscriptionReminder | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payment/me");
        if (!res.ok) return;
        const data = await res.json();
        const r = data.reminder as SubscriptionReminder | null;
        if (!r || cancelled) return;
        if (isReminderDismissed(r)) return;
        setReminder(r);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!reminder || hidden) return null;

  return (
    <SubscriptionReminderBanner
      reminder={reminder}
      onDismiss={() => {
        dismissReminder(reminder);
        setHidden(true);
      }}
    />
  );
}
