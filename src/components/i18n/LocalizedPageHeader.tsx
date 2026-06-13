"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import type { AppCopy } from "@/lib/i18n/get-copy";
import { useAppLocale } from "./AppLocaleProvider";

type AdminSection = keyof AppCopy["admin"];
type SalesSection = keyof AppCopy["sales"];

export function LocalizedAdminHeader({
  section,
  compact,
  actions,
  subtitle,
}: {
  section: AdminSection;
  compact?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
}) {
  const { t } = useAppLocale();
  const copy = t.admin[section];
  return (
    <PageHeader
      badge={copy.badge}
      title={copy.title}
      subtitle={subtitle ?? copy.subtitle}
      compact={compact}
      actions={actions}
    />
  );
}

export function LocalizedSalesHeader({
  section,
  compact,
  actions,
}: {
  section: SalesSection;
  compact?: boolean;
  actions?: React.ReactNode;
}) {
  const { t } = useAppLocale();
  const copy = t.sales[section];
  return (
    <PageHeader
      badge={copy.badge}
      title={copy.title}
      subtitle={copy.subtitle}
      compact={compact}
      actions={actions}
    />
  );
}
