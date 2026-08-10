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
    "total_leads" | "no_follow_up" | "follow_up_1" | "follow_up_2" | "followed_up_three"
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
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {sf.stageTabsLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition",
                active
                  ? "btn-primary-solid border-transparent"
                  : "bg-[var(--surface-card)] hover:bg-[var(--surface-muted)]"
              )}
              style={
                active
                  ? undefined
                  : {
                      borderColor: "var(--border-color)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "tabular-nums text-xs font-bold min-w-[1.5rem] px-1.5 py-0.5 rounded-md",
                    active ? "bg-white/20 text-inherit" : "bg-[var(--surface-muted)]"
                  )}
                  style={active ? undefined : { color: "var(--text-primary)" }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
