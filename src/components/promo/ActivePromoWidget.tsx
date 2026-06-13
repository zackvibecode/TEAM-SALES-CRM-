"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { PromoCard } from "./PromoCard";
import type { Promo } from "@/types/promo";

interface ActivePromoWidgetProps {
  viewAllHref: string;
  limit?: number;
}

export function ActivePromoWidget({ viewAllHref, limit = 3 }: ActivePromoWidgetProps) {
  const { t } = useAppLocale();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/promos?active=true&limit=${limit}`);
        const data = await res.json();
        if (res.ok) setPromos(data.promos || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [limit]);

  if (loading) {
    return (
      <div className="surface-card card-padded animate-pulse h-32" />
    );
  }

  if (promos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {t.promo.activePromos}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.promo.activePromosSubtitle}
          </p>
        </div>
        <Link href={viewAllHref} className="text-xs font-medium text-[#3b66ff] hover:underline">
          {t.promo.viewAll}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {promos.map((promo) => (
          <PromoCard key={promo.id} promo={promo} />
        ))}
      </div>
    </div>
  );
}
