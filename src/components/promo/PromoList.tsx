"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  collectPromoMonthKeys,
  formatMonthKeyLabel,
  promoMatchesMonth,
} from "@/lib/promo/countdown";
import { PromoCard } from "./PromoCard";
import type { Promo } from "@/types/promo";

interface PromoListProps {
  promos: Promo[];
  basePath: string;
  currentUserId: string;
  isAdmin: boolean;
  showNewButton?: boolean;
}

export function PromoList({
  promos,
  basePath,
  currentUserId,
  isAdmin,
  showNewButton = true,
}: PromoListProps) {
  const { locale, t } = useAppLocale();
  const [items, setItems] = useState(promos);
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const monthOptions = useMemo(() => collectPromoMonthKeys(items), [items]);

  const filteredItems = useMemo(
    () => items.filter((promo) => promoMatchesMonth(promo, monthFilter || null)),
    [items, monthFilter]
  );

  const canModify = useCallback(
    (promo: Promo) => isAdmin || promo.created_by === currentUserId,
    [isAdmin, currentUserId]
  );

  const handleDelete = async (id: string) => {
    if (!confirm(t.common.confirmDelete)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/promos?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {monthOptions.length > 0 && (
          <div className="min-w-[200px] flex-1 max-w-xs">
            <label
              htmlFor="promo-month-filter"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {t.promo.filterByMonth}
            </label>
            <select
              id="promo-month-filter"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="">{t.promo.allMonths}</option>
              {monthOptions.map((key) => (
                <option key={key} value={key}>
                  {formatMonthKeyLabel(key, locale)}
                </option>
              ))}
            </select>
          </div>
        )}

        {showNewButton && (
          <Link href={`${basePath}/new`} className="btn-primary-solid text-sm shrink-0">
            + {t.promo.newPromo}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card-padded text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t.promo.noPromos}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-padded text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t.promo.noPromosForMonth}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              editHref={canModify(promo) ? `${basePath}/${promo.id}/edit` : undefined}
              canEdit={canModify(promo)}
              clickableWhenActive
              onDelete={
                canModify(promo) && deleting !== promo.id
                  ? () => handleDelete(promo.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
