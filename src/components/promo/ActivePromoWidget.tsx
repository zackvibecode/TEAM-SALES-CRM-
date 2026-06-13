"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="surface-card aspect-square animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (promos.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shrink-0"
            style={{ background: "var(--surface-hover)", color: "#3b66ff" }}
          >
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {t.promo.activePromos}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t.promo.activePromosSubtitle}
            </p>
          </div>
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold text-[#3b66ff] hover:underline inline-flex items-center gap-1 shrink-0"
        >
          {t.promo.viewAll}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promos.map((promo) => (
          <PromoCard key={promo.id} promo={promo} clickableWhenActive />
        ))}
      </div>
    </div>
  );
}
