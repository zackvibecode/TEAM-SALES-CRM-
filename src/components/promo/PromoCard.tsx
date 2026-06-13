"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { isPromoFullyExpired } from "@/lib/promo/countdown";
import { PromoDepartureCountdowns } from "./PromoDepartureCountdowns";
import { PromoDetailModal } from "./PromoDetailModal";
import { PromoPosterViewer } from "./PromoPosterViewer";
import type { Promo } from "@/types/promo";

interface PromoCardProps {
  promo: Promo;
  editHref?: string;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  clickableWhenActive?: boolean;
}

export function PromoCard({
  promo,
  editHref,
  canEdit = false,
  onDelete,
  clickableWhenActive = false,
}: PromoCardProps) {
  const { t } = useAppLocale();
  const [detailOpen, setDetailOpen] = useState(false);
  const isExpired = isPromoFullyExpired(promo);
  const isActivePromo = promo.is_active && !isExpired;
  const canOpenDetail = clickableWhenActive && isActivePromo;

  const openDetail = () => {
    if (canOpenDetail) setDetailOpen(true);
  };

  return (
    <>
      <div
        className={`surface-card overflow-hidden card-padded ${
          canOpenDetail ? "cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-[#3b66ff]/25" : ""
        }`}
        onClick={canOpenDetail ? openDetail : undefined}
        onKeyDown={
          canOpenDetail
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDetail();
                }
              }
            : undefined
        }
        role={canOpenDetail ? "button" : undefined}
        tabIndex={canOpenDetail ? 0 : undefined}
        aria-label={canOpenDetail ? `${t.promo.viewDetails}: ${promo.title}` : undefined}
      >
        <div className="flex gap-4">
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <PromoPosterViewer src={promo.poster_url} title={promo.title} />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                  {promo.title}
                </h3>
                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {promo.promo_text}
                </p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  !promo.is_active || isExpired
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {!promo.is_active || isExpired ? t.common.ended : t.common.active}
              </span>
            </div>

            <PromoDepartureCountdowns promo={promo} compact />

            {promo.creator && (
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {t.promo.createdBy}: {(promo.creator as { full_name?: string }).full_name || "—"}
              </p>
            )}

            {canEdit && editHref && (
              <div
                className="flex gap-2 pt-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Link href={editHref} className="btn-secondary text-xs inline-flex items-center gap-1 py-1 px-2">
                  <Pencil className="w-3 h-3" />
                  {t.common.edit}
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(promo.id)}
                    className="btn-secondary text-xs inline-flex items-center gap-1 py-1 px-2 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t.common.delete}
                  </button>
                )}
              </div>
            )}

            {canOpenDetail && (
              <p className="text-[10px] text-[#3b66ff]">{t.promo.tapForDetails}</p>
            )}
          </div>
        </div>
      </div>

      {canOpenDetail && (
        <PromoDetailModal promo={promo} open={detailOpen} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
