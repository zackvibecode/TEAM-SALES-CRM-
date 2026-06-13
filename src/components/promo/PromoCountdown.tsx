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
  showDateLabel?: boolean;
  className?: string;
  variant?: "chip" | "plain";
  size?: "sm" | "md" | "lg";
}

export function PromoCountdown({
  endsAt,
  packageName,
  showEndDate = true,
  showMytNote = false,
  showDateLabel = true,
  className = "",
  variant = "chip",
  size = "md",
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

  const dateSize =
    size === "lg" ? "text-xl sm:text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const countdownSize =
    size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";
  const nameSize = size === "lg" ? "text-sm" : "text-xs";

  const departureDate = formatPromoEndDate(endsAt, locale);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 min-w-0">
        {packageName ? (
          <p
            className={`${nameSize} font-semibold truncate`}
            style={{ color: "var(--text-secondary)" }}
          >
            {packageName}
          </p>
        ) : (
          <span />
        )}
        <span
          className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            countdown.expired
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {countdown.expired ? t.common.ended : t.common.active}
        </span>
      </div>

      {showEndDate && (
        <div className="mt-2">
          {showDateLabel && (
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {t.promo.endsOnLabel}
            </p>
          )}
          <p
            className={`${dateSize} font-extrabold leading-tight tracking-tight`}
            style={{ color: "var(--text-primary)" }}
          >
            {departureDate}
          </p>
        </div>
      )}

      <p
        className={`${countdownSize} font-bold tabular-nums mt-1.5 ${
          countdown.expired
            ? "text-red-600 dark:text-red-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {countdown.label}
      </p>

      {showMytNote && (
        <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
          {t.promo.mytNote}
        </p>
      )}
    </>
  );

  if (variant === "plain") {
    return <div className={`space-y-0.5 ${className}`}>{inner}</div>;
  }

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 transition-colors ${
        countdown.expired
          ? "border-red-200/80 dark:border-red-900/50"
          : "border-blue-200/80 dark:border-blue-900/40"
      } ${className}`}
      style={{ background: "var(--surface-hover)" }}
    >
      {inner}
    </div>
  );
}
