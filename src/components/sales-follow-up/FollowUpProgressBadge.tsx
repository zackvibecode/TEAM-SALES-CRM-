"use client";

import { cn } from "@/lib/utils";

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
  let label: string;
  let colorClass: string;

  if (count === 0) {
    label = "Belum Follow-Up";
    colorClass =
      "bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-color)]";
  } else if (count === 1) {
    label = "1 / 3 Follow-Up";
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
  } else if (count === 2) {
    label = "2 / 3 Follow-Up";
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
  } else if (count === 3) {
    label = "3 / 3 Selesai";
    colorClass = "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
  } else {
    label = `${count}x Follow-Up`;
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
  if (count === 0) return "Belum Follow-Up";
  if (count === 1) return "1 Kali Follow-Up";
  if (count === 2) return "2 Kali Follow-Up";
  return "Minimum 3 Kali Selesai";
}
