import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  compact?: boolean;
  greeting?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  className,
  compact,
  greeting,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn("page-hero", compact && "page-hero--compact", className)}>
      <div className="page-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          {badge && <span className="page-hero-badge">{badge}</span>}
          {greeting && (
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              {greeting}
            </p>
          )}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
