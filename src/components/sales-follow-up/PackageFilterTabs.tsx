"use client";

import { Package } from "lucide-react";
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

  const options: Array<{ value: PackageFilterValue; label: string; count: number }> = [
    { value: "all", label: sf.packageAll, count: totalCount },
    ...namedPackages.map((p) => ({
      value: p.name as PackageFilterValue,
      label: p.name,
      count: p.count,
    })),
  ];

  if (noneEntry && noneEntry.count > 0) {
    options.push({
      value: PACKAGE_FILTER_NONE,
      label: sf.packageNone,
      count: noneEntry.count,
    });
  }

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <section
      className="surface-card rounded-xl border px-3 py-3 sm:px-4 sm:py-3"
      style={{ borderColor: "var(--border-color)" }}
      aria-label={sf.packageTabsLabel}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-warning-500, #f59e0b) 16%, transparent)",
              color: "var(--color-warning-600, #d97706)",
            }}
          >
            <Package className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {sf.packageTabsLabel}
            </p>
            {namedPackages.length === 0 && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {sf.packageEmptyHint}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 sm:max-w-md sm:ml-auto">
          <label className="sr-only" htmlFor="sfu-package-filter">
            {sf.packageTabsLabel}
          </label>
          <select
            id="sfu-package-filter"
            value={value}
            onChange={(e) => onChange(e.target.value as PackageFilterValue)}
            className="input-field w-full text-sm font-medium"
            style={{ minHeight: "40px" }}
            disabled={options.length <= 1 && namedPackages.length === 0}
          >
            {options.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label} ({opt.count})
              </option>
            ))}
          </select>
          {namedPackages.length > 0 && selected && selected.value !== "all" && (
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
              {sf.packageTabsHint}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
