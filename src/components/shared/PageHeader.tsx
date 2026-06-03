import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  compact?: boolean;
}

export function PageHeader({ title, subtitle, badge, className, compact }: PageHeaderProps) {
  return (
    <div className={cn("page-hero", compact && "page-hero--compact", className)}>
      <div className="page-hero-inner">
        {badge && <span className="page-hero-badge">{badge}</span>}
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
