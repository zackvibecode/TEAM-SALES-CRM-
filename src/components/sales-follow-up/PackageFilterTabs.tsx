"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  PACKAGE_FILTER_NONE,
  type PackageCount,
} from "@/lib/sales-follow-up/types";

export type PackageFilterValue = "all" | typeof PACKAGE_FILTER_NONE | string;

interface PackageFilterTabsProps {
  value: string;
  onChange: (value: PackageFilterValue) => void;
  packages: PackageCount[];
}

export function PackageFilterTabs({
  value,
  onChange,
  packages,
}: PackageFilterTabsProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;

  const totalCount = packages.reduce((sum, p) => sum + p.count, 0);
  const noneEntry = packages.find((p) => p.name === "");
  const namedPackages = packages.filter((p) => p.name !== "");

  const tabs: Array<{ value: PackageFilterValue; label: string; count: number }> = [
    { value: "all", label: sf.packageAll, count: totalCount },
    ...namedPackages.map((p) => ({
      value: p.name as PackageFilterValue,
      label: p.name,
      count: p.count,
    })),
  ];

  if (noneEntry && noneEntry.count > 0) {
    tabs.push({
      value: PACKAGE_FILTER_NONE,
      label: sf.packageNone,
      count: noneEntry.count,
    });
  }

  // Always render for every user (admin + sales), even with 0 packages
  return (
    <section
      className="surface-card rounded-2xl border-2 px-4 py-4 sm:px-5 sm:py-5 space-y-3"
      style={{
        borderColor: "var(--color-warning-500, #f59e0b)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--color-warning-500, #f59e0b) 8%, var(--surface-card)) 0%, var(--surface-card) 100%)",
      }}
      aria-label={sf.packageTabsLabel}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-warning-500, #f59e0b) 18%, transparent)",
            color: "var(--color-warning-600, #d97706)",
          }}
        >
          <Package className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {sf.packageTabsLabel}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {namedPackages.length === 0 ? sf.packageEmptyHint : sf.packageTabsHint}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => {
          const active = value === tab.value;
          return (
            <button
              key={tab.value || "none"}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl border-2 transition min-h-[48px] max-w-full",
                active
                  ? "border-amber-600 bg-amber-500 text-white shadow-sm dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950"
                  : "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20"
              )}
            >
              <span className="truncate">{tab.label}</span>
              <span
                className={cn(
                  "tabular-nums text-xs font-extrabold min-w-[1.75rem] px-1.5 py-0.5 rounded-md text-center shrink-0",
                  active ? "bg-white/25 dark:bg-black/10" : "bg-black/5 dark:bg-white/10"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
