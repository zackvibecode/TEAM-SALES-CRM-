"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Filter, PackagePlus, Sparkles } from "lucide-react";
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
    <div className="space-y-5">
      <div className="surface-card card-padded flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div
            className="p-2 rounded-xl shrink-0"
            style={{ background: "var(--surface-hover)", color: "#3b66ff" }}
          >
            <Filter className="w-4 h-4" />
          </div>
          {monthOptions.length > 0 ? (
            <div className="flex-1 max-w-xs">
              <label htmlFor="promo-month-filter" className="sr-only">
                {t.promo.filterByMonth}
              </label>
              <select
                id="promo-month-filter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="input-field w-full text-sm"
              >
                <option value="">{t.promo.allMonths}</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthKeyLabel(key, locale)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.promo.allMonths}
            </p>
          )}
          {filteredItems.length > 0 && (
            <span
              className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
              style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
            >
              {filteredItems.length}
            </span>
          )}
        </div>

        {showNewButton && (
          <Link
            href={`${basePath}/new`}
            className="btn-primary-solid text-sm shrink-0 inline-flex items-center gap-2"
          >
            <PackagePlus className="w-4 h-4" />
            {t.promo.newPromo}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className="surface-card card-padded text-center py-16 space-y-3"
          style={{ color: "var(--text-muted)" }}
        >
          <Sparkles className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-medium">{t.promo.noPromos}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="surface-card card-padded text-center py-12 space-y-2"
          style={{ color: "var(--text-muted)" }}
        >
          <Calendar className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm">{t.promo.noPromosForMonth}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
