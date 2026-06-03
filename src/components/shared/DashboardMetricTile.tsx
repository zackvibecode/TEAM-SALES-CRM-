import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { StatAccent } from "./StatCard";

const accentStyles: Record<StatAccent, { icon: string; ring: string }> = {
  blue: { icon: "text-blue-600", ring: "bg-blue-50 border-blue-100/90" },
  sky: { icon: "text-sky-600", ring: "bg-sky-50 border-sky-100/90" },
  slate: { icon: "text-slate-600", ring: "bg-slate-50 border-slate-200/90" },
  mint: { icon: "text-teal-600", ring: "bg-emerald-50 border-emerald-100/90" },
  amber: { icon: "text-amber-600", ring: "bg-amber-50 border-amber-100/90" },
};

export function DashboardMetricTile({
  label,
  value,
  icon: Icon,
  accent = "blue",
  highlight,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: StatAccent;
  highlight?: boolean;
}) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0 transition",
        highlight
          ? "bg-gradient-to-br from-blue-50/95 to-white border-blue-200/90 shadow-sm"
          : "bg-white/75 border-white/95 shadow-[0_2px_10px_-6px_rgba(59,130,246,0.16)]"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
          styles.ring
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", styles.icon)} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
          {label}
        </p>
        <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

export function DashboardMetricSection({
  title,
  children,
  columns = 4,
}: {
  title?: string;
  children: ReactNode;
  columns?: 3 | 4 | 5;
}) {
  const gridClass =
    columns === 5
      ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2"
      : columns === 3
        ? "grid grid-cols-1 sm:grid-cols-3 gap-2"
        : "grid grid-cols-2 lg:grid-cols-4 gap-2";

  return (
    <div>
      {title && (
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2 px-0.5">
          {title}
        </h3>
      )}
      <div className={gridClass}>{children}</div>
    </div>
  );
}

export function DashboardMetricPanel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="glass-strong rounded-2xl p-4 md:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-1 border-b border-blue-100/80">
        <div className="flex items-center gap-2">
          <span className="icon-stat">
            <Icon />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
