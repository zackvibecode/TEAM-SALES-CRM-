"use client";

import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { normalizeDepartureEntries } from "@/lib/promo/countdown";
import { PromoCountdown } from "./PromoCountdown";

interface PromoDepartureCountdownsProps {
  promo: { title?: string; ends_at?: string | null; departure_dates?: unknown[] | null };
  className?: string;
  compact?: boolean;
}

export function PromoDepartureCountdowns({
  promo,
  className = "",
  compact = false,
}: PromoDepartureCountdownsProps) {
  const { t } = useAppLocale();
  const entries = normalizeDepartureEntries(promo);
  if (entries.length === 0) return null;

  const visible = compact ? entries.slice(0, 2) : entries;
  const hiddenCount = compact ? Math.max(0, entries.length - visible.length) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {visible.map((entry) => (
        <PromoCountdown
          key={`${entry.name}-${entry.date}`}
          endsAt={entry.date}
          packageName={entry.name || undefined}
          size={compact ? "sm" : "lg"}
        />
      ))}
      {hiddenCount > 0 && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {t.promo.morePackages.replace("{count}", String(hiddenCount))}
        </p>
      )}
    </div>
  );
}
