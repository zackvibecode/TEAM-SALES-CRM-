"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PromoForm } from "@/components/promo/PromoForm";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

export function PromoNewClient({ basePath, isAdmin }: { basePath: string; isAdmin: boolean }) {
  const { t } = useAppLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        badge={isAdmin ? t.admin.dashboard.badge : t.sales.dashboard.badge}
        title={t.promo.newPromo}
        subtitle={t.promo.subtitle}
      />
      <PromoForm basePath={basePath} />
    </div>
  );
}
