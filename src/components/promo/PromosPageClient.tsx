"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { PromoList } from "@/components/promo/PromoList";
import { PromoActivityPanel } from "@/components/promo/PromoActivityPanel";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { Promo } from "@/types/promo";

interface PromosPageClientProps {
  promos: Promo[];
  currentUserId: string;
  isAdmin: boolean;
  basePath: string;
}

export function PromosPageClient({
  promos,
  currentUserId,
  isAdmin,
  basePath,
}: PromosPageClientProps) {
  const { t } = useAppLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        badge={isAdmin ? t.admin.dashboard.badge : t.sales.dashboard.badge}
        title={t.promo.title}
        subtitle={t.promo.subtitle}
      />
      <PromoList
        promos={promos}
        basePath={basePath}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      {isAdmin && <PromoActivityPanel limit={20} />}
    </div>
  );
}
