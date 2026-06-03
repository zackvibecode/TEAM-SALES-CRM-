import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatAccent = "blue" | "sky" | "slate" | "mint" | "amber";

const iconTint: Record<StatAccent, string> = {
  blue: "text-[#3b66ff]",
  sky: "text-sky-500",
  slate: "text-slate-500",
  mint: "text-teal-500",
  amber: "text-amber-500",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: StatAccent;
  color?: string;
  subtext?: string;
  variant?: "default" | "primary";
}

function accentFromLegacy(color?: string): StatAccent {
  if (!color) return "blue";
  if (color.includes("amber")) return "amber";
  if (color.includes("emerald") || color.includes("green")) return "mint";
  return "blue";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  color,
  subtext,
  variant = "default",
}: StatCardProps) {
  const tint = iconTint[accent ?? accentFromLegacy(color)];
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-2xl p-4 md:p-5 transition surface-card",
        isPrimary && "stat-card-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className={cn("stat-label text-xs font-medium", isPrimary ? "" : "text-[var(--text-muted)]")}>
            {label}
          </p>
          <p
            className={cn(
              "stat-value text-2xl md:text-3xl font-bold tabular-nums tracking-tight",
              isPrimary ? "" : "text-[var(--text-primary)]"
            )}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtext && (
            <p className={cn("text-xs", isPrimary ? "text-white/80" : "text-[var(--text-muted)]")}>
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("icon-stat", !isPrimary && tint)}>
            <Icon />
          </div>
        )}
      </div>
    </div>
  );
}
