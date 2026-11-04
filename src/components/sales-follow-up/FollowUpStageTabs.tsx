"use client";

import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { DashboardStats } from "@/lib/sales-follow-up/types";

export type FollowUpStageValue = "all" | "0" | "1" | "2" | "3+";

interface FollowUpStageTabsProps {
  value: string;
  onChange: (value: FollowUpStageValue) => void;
  stats?: Pick<
    DashboardStats,
    "total_leads" | "no_follow_up" | "follow_up_1" | "follow_up_2" | "followed_up_three" | "overdue"
  > | null;
}

export function FollowUpStageTabs({ value, onChange, stats }: FollowUpStageTabsProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;

  const tabs: Array<{
    value: FollowUpStageValue;
    label: string;
    count?: number;
  }> = [
    { value: "all", label: sf.stageAll, count: stats?.total_leads },
    { value: "0", label: sf.stageNone, count: stats?.no_follow_up },
    { value: "1", label: sf.stageFu1, count: stats?.follow_up_1 },
    { value: "2", label: sf.stageFu2, count: stats?.follow_up_2 },
    { value: "3+", label: sf.stageDone, count: stats?.followed_up_three },
  ];

  return (
    <div className="w-full">
      {/* Stage row — hero. Nombor besar, tiada box/gradient. */}
      <div
        role="tablist"
        aria-label={sf.stageTabsLabel}
        className="flex flex-wrap gap-x-1 gap-y-2 border-b-2"
        style={{ borderColor: "var(--border-color)" }}
      >
        {tabs.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-t-lg transition",
                active ? "" : "hover:bg-[var(--surface-muted)]"
              )}
              style={!active ? { color: "var(--text-secondary)" } : undefined}
            >
              {/* Nombor = elemen dominan */}
              <span
                className={cn(
                  "tabular-nums text-2xl font-bold leading-none transition-colors",
                )}
                style={
                  active
                    ? { color: "var(--color-primary-600, #1d4ed8)" }
                    : undefined
                }
              >
                {typeof tab.count === "number" ? tab.count : "…"}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "font-bold" : ""
                )}
                style={active ? { color: "var(--text-primary)" } : undefined}
              >
                {tab.label}
              </span>
              {/* Underline indicator — satu benda biru sahaja */}
              <span
                className="absolute left-0 right-0 -bottom-[2px] h-[3px] rounded-full transition-opacity"
                style={{
                  backgroundColor: "var(--color-primary-600, #1d4ed8)",
                  opacity: active ? 1 : 0,
                }}
              />
            </button>
          );
        })}

        {/* Overdue — badge kecil di hujung row, hanya bila > 0 */}
        {typeof stats?.overdue === "number" && stats.overdue > 0 && (
          <span
            className="ml-auto self-center inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error-500, #ef4444) 10%, transparent)",
              color: "var(--color-error-600, #dc2626)",
            }}
          >
            {sf.filterOverdue}: {stats.overdue}
          </span>
        )}
      </div>
    </div>
  );
}
