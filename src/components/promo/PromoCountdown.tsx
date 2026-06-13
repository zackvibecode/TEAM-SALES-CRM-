"use client";

import { useEffect, useState } from "react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  countdownRefreshMs,
  formatPromoEndDate,
  getPromoCountdown,
} from "@/lib/promo/countdown";

interface PromoCountdownProps {
  endsAt: string | null | undefined;
  packageName?: string;
  showEndDate?: boolean;
  showMytNote?: boolean;
  className?: string;
}

export function PromoCountdown({
  endsAt,
  packageName,
  showEndDate = true,
  showMytNote = false,
  className = "",
}: PromoCountdownProps) {
  const { locale, t } = useAppLocale();
  const [now, setNow] = useState(() => Date.now());

  const countdown = getPromoCountdown(endsAt, locale, now);

  useEffect(() => {
    if (!endsAt) return;
    const endMs = new Date(endsAt).getTime();
    const remaining = endMs - Date.now();
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, countdownRefreshMs(remaining));

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt || !countdown) return null;

  return (
    <div className={`space-y-0.5 ${className}`}>
      {packageName && (
        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          {packageName}
        </p>
      )}
      <p
        className={`text-sm font-semibold tabular-nums ${
          countdown.expired ? "text-red-500" : "text-[#3b66ff]"
        }`}
      >
        {countdown.label}
      </p>
      {showEndDate && (
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
          {t.promo.endsOnLabel}: {formatPromoEndDate(endsAt, locale)}
        </p>
      )}
      {showMytNote && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {t.promo.mytNote}
        </p>
      )}
    </div>
  );
}
