import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, type LucideIcon } from "lucide-react";

export type StatAccent =
  | "brand"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "gray";

const accentBadge: Record<
  StatAccent,
  { light: string; dark: string; icon: string }
> = {
  brand: {
    light: "bg-brand-50 text-brand-600",
    dark: "dark:bg-brand-500/15 dark:text-brand-400",
    icon: "text-brand-600 dark:text-brand-400",
  },
  success: {
    light: "bg-success-50 text-success-600",
    dark: "dark:bg-success-500/15 dark:text-success-500",
    icon: "text-success-600 dark:text-success-500",
  },
  error: {
    light: "bg-error-50 text-error-600",
    dark: "dark:bg-error-500/15 dark:text-error-500",
    icon: "text-error-600 dark:text-error-500",
  },
  warning: {
    light: "bg-warning-50 text-warning-600",
    dark: "dark:bg-warning-500/15 dark:text-orange-400",
    icon: "text-warning-600 dark:text-orange-400",
  },
  info: {
    light: "bg-blue-light-50 text-blue-light-500",
    dark: "dark:bg-blue-light-500/15 dark:text-blue-light-500",
    icon: "text-blue-light-500 dark:text-blue-light-400",
  },
  gray: {
    light: "bg-gray-100 text-gray-700",
    dark: "dark:bg-white/5 dark:text-white/80",
    icon: "text-gray-600 dark:text-white/80",
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: StatAccent;
  variant?: "default" | "primary";
  valueSize?: "default" | "compact";
  delta?: { value: string; trend: "up" | "down" | "neutral" };
  subtext?: string;
  color?: string;
}

function legacyToAccent(color?: string): StatAccent {
  if (!color) return "gray";
  if (color.includes("amber")) return "warning";
  if (color.includes("emerald") || color.includes("green")) return "success";
  if (color.includes("sky")) return "info";
  return "brand";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  variant = "default",
  valueSize = "default",
  delta,
  subtext,
  color,
}: StatCardProps) {
  const resolvedAccent = accent ?? legacyToAccent(color);
  const styles = accentBadge[resolvedAccent];
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-xl p-4 md:p-5 transition surface-card h-full",
        isPrimary && "stat-card-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p
            className={cn(
              "stat-label text-xs font-medium tracking-wide",
              isPrimary ? "" : "text-[var(--text-muted)]"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "stat-value font-bold tracking-tight truncate",
              valueSize === "compact"
                ? "text-sm md:text-base uppercase"
                : "text-2xl md:text-[1.75rem] tabular-nums leading-none",
              isPrimary ? "" : "text-[var(--text-primary)]"
            )}
            title={typeof value === "string" ? value : undefined}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtext && (
            <p
              className={cn(
                "text-xs",
                isPrimary ? "text-[#163300]/70" : "text-[var(--text-muted)]"
              )}
            >
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "icon-stat",
              !isPrimary && cn(styles.icon, "bg-[var(--surface-muted)]")
            )}
          >
            <Icon />
          </div>
        )}
      </div>

      {delta && (
        <span
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            delta.trend === "up" && styles.light,
            delta.trend === "up" && styles.dark,
            delta.trend === "down" &&
              "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
            delta.trend === "neutral" && styles.light,
            delta.trend === "neutral" && styles.dark,
            isPrimary && "bg-[#163300]/15 text-[#163300]"
          )}
        >
          {delta.trend === "up" && <ArrowUpIcon className="size-3" />}
          {delta.trend === "down" && <ArrowDownIcon className="size-3" />}
          {delta.value}
        </span>
      )}
    </div>
  );
}
