"use client";

import { LocalizedAdminHeader } from "./LocalizedPageHeader";
import { useAppLocale } from "./AppLocaleProvider";
import { PageHeader } from "@/components/shared/PageHeader";
import type { AppCopy } from "@/lib/i18n/get-copy";

export function AdminPageShell({
  section,
  children,
  compact,
  actions,
  className = "dashboard-shell space-y-6",
}: {
  section: keyof AppCopy["admin"];
  children: React.ReactNode;
  compact?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <LocalizedAdminHeader section={section} compact={compact} actions={actions} />
      {children}
    </div>
  );
}

export function SalesPageShell({
  section,
  children,
  compact,
  actions,
  className = "dashboard-shell space-y-6",
  subtitle,
}: {
  section: keyof AppCopy["sales"];
  children: React.ReactNode;
  compact?: boolean;
  actions?: React.ReactNode;
  className?: string;
  subtitle?: string;
}) {
  const { t } = useAppLocale();
  const copy = t.sales[section];
  return (
    <div className={className}>
      <PageHeader
        badge={copy.badge}
        title={copy.title}
        subtitle={subtitle ?? copy.subtitle}
        compact={compact}
        actions={actions}
      />
      {children}
    </div>
  );
}

export function RotatorPageShell({
  children,
  actions,
  subtitle,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: string;
}) {
  const { t } = useAppLocale();
  return (
    <div className="dashboard-shell space-y-6">
      <PageHeader
        badge={t.admin.dashboard.badge}
        title={t.rotator.title}
        subtitle={subtitle ?? t.rotator.subtitle}
        compact
        actions={actions}
      />
      {children}
    </div>
  );
}
