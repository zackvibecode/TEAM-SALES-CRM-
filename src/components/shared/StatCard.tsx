import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatAccent = "blue" | "sky" | "slate" | "mint" | "amber";

const iconTint: Record<StatAccent, string> = {
  blue: "text-blue-600",
  sky: "text-sky-600",
  slate: "text-slate-600",
  mint: "text-teal-600",
  amber: "text-amber-600",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: StatAccent;
  color?: string;
  subtext?: string;
}

function accentFromLegacy(color?: string): StatAccent {
  if (!color) return "blue";
  if (color.includes("amber")) return "amber";
  if (color.includes("emerald") || color.includes("green")) return "mint";
  return "blue";
}

export function StatCard({ label, value, icon: Icon, accent, color, subtext }: StatCardProps) {
  const tint = iconTint[accent ?? accentFromLegacy(color)];

  return (
    <div className="glass-strong rounded-3xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-glass-lg)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</p>
          {subtext && <p className="text-[11px] text-slate-500">{subtext}</p>}
        </div>
        {Icon && (
          <div className={cn("icon-stat", tint)}>
            <Icon />
          </div>
        )}
      </div>
    </div>
  );
}
