"use client";

import { Filter } from "lucide-react";
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

const STAGE_TONE: Record<
  FollowUpStageValue,
  { idle: string; active: string; badge: string }
> = {
  all: {
    idle: "border-[var(--border-color)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
    active: "btn-primary-solid border-transparent shadow-sm",
    badge: "bg-white/20",
  },
  "0": {
    idle: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-500/10 dark:text-slate-200 dark:hover:bg-slate-500/20",
    active: "border-slate-700 bg-slate-700 text-white shadow-sm dark:border-slate-400 dark:bg-slate-400 dark:text-slate-900",
    badge: "bg-white/20 dark:bg-black/10",
  },
  "1": {
    idle: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20",
    active: "border-amber-600 bg-amber-500 text-white shadow-sm dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950",
    badge: "bg-white/25 dark:bg-black/10",
  },
  "2": {
    idle: "border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20",
    active: "border-orange-600 bg-orange-500 text-white shadow-sm dark:border-orange-400 dark:bg-orange-400 dark:text-orange-950",
    badge: "bg-white/25 dark:bg-black/10",
  },
  "3+": {
    idle: "border-green-300 bg-green-50 text-green-900 hover:bg-green-100 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200 dark:hover:bg-green-500/20",
    active: "border-green-700 bg-green-600 text-white shadow-sm dark:border-green-400 dark:bg-green-400 dark:text-green-950",
    badge: "bg-white/25 dark:bg-black/10",
  },
};

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
    <section
      className="surface-card rounded-2xl border-2 px-4 py-4 sm:px-5 sm:py-5 space-y-3"
      style={{
        borderColor: "var(--color-info-500, #3b82f6)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--color-info-500, #3b82f6) 8%, var(--surface-card)) 0%, var(--surface-card) 100%)",
      }}
      aria-label={sf.stageTabsLabel}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-info-500, #3b82f6) 18%, transparent)",
            color: "var(--color-info-600, #2563eb)",
          }}
        >
          <Filter className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {sf.stageTabsLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sf.stageTabsHint}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => {
          const active = value === tab.value;
          const tone = STAGE_TONE[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl border-2 transition min-h-[48px]",
                active ? tone.active : tone.idle
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "tabular-nums text-xs font-extrabold min-w-[1.75rem] px-1.5 py-0.5 rounded-md text-center",
                    active ? tone.badge : "bg-black/5 dark:bg-white/10"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
