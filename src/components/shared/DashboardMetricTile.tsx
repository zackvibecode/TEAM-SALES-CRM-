import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StatCard, type StatAccent } from "./StatCard";

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
  return (
    <StatCard
      label={label}
      value={value}
      icon={Icon}
      accent={accent}
      variant={highlight ? "primary" : "default"}
    />
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
      ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4"
      : columns === 3
        ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
        : "grid grid-cols-2 lg:grid-cols-4 gap-4";

  return (
    <div>
      {title && (
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
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
    <section className="card-padded-sm space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--border-color)" }}>
        <span className="icon-stat">
          <Icon />
        </span>
        <div>
          <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
