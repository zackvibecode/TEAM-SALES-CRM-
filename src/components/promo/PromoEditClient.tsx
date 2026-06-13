"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PromoForm } from "@/components/promo/PromoForm";
import { PromoActivityPanel } from "@/components/promo/PromoActivityPanel";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { Promo } from "@/types/promo";

interface PromoEditClientProps {
  promo: Promo;
  basePath: string;
  isAdmin: boolean;
}

export function PromoEditClient({ promo, basePath, isAdmin }: PromoEditClientProps) {
  const { t } = useAppLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        badge={isAdmin ? t.admin.dashboard.badge : t.sales.dashboard.badge}
        title={t.promo.editPromo}
        subtitle={promo.title}
      />
      <PromoForm promo={promo} basePath={basePath} />
      <PromoActivityPanel promoId={promo.id} />
    </div>
  );
}
