"use client";

import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { sfReplace } from "@/lib/i18n/en/salesFollowUp";

interface FollowUpProgressBadgeProps {
  count: number;
  size?: "sm" | "md";
  showSteps?: boolean;
}

export function FollowUpProgressBadge({
  count,
  size = "md",
  showSteps = true,
}: FollowUpProgressBadgeProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;

  let label: string;
  let colorClass: string;

  if (count === 0) {
    label = sf.badgeNone;
    colorClass =
      "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]";
  } else if (count === 1) {
    label = sf.badgeOne;
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
  } else if (count === 2) {
    label = sf.badgeTwo;
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
  } else if (count === 3) {
    label = sf.badgeThree;
    colorClass = "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
  } else {
    label = sfReplace(sf.badgeMore, { n: count });
    colorClass = "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span
        className={cn(
          "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          colorClass
        )}
      >
        {label}
      </span>
      {showSteps && (
        <div className="flex items-center gap-1" aria-hidden>
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cn(
                "size-1.5 rounded-full",
                count >= step
                  ? count >= 3
                    ? "bg-green-500"
                    : count === 2
                      ? "bg-orange-500"
                      : "bg-amber-500"
                  : "bg-[var(--border-color)]"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FollowUpStatusLabel({ count }: { count: number }) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  if (count === 0) return sf.labelNone;
  if (count === 1) return sf.labelOne;
  if (count === 2) return sf.labelTwo;
  return sf.labelThreePlus;
}
