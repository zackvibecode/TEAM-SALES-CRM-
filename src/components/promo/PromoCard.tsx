"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { isPromoFullyExpired, normalizeDepartureEntries } from "@/lib/promo/countdown";
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
  const packages = normalizeDepartureEntries(promo);
  const packageCount = packages.length;

  const openDetail = () => {
    if (canOpenDetail) setDetailOpen(true);
  };

  const statusBadge = (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-lg backdrop-blur-sm ${
        !promo.is_active || isExpired
          ? "bg-red-500/90 text-white"
          : "bg-emerald-500/90 text-white"
      }`}
    >
      {!promo.is_active || isExpired ? t.common.ended : t.common.active}
    </span>
  );

  return (
    <>
      <article
        className={`group surface-card overflow-hidden flex flex-col h-full transition-all duration-200 ${
          canOpenDetail
            ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-[#3b66ff]/30"
            : ""
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
        <div className="relative aspect-square bg-[var(--surface-muted)] overflow-hidden">
          {promo.poster_url ? (
            <div onClick={(e) => e.stopPropagation()} className="absolute inset-0">
              <PromoPosterViewer
                src={promo.poster_url}
                title={promo.title}
                thumbnailClassName="relative w-full h-full aspect-square overflow-hidden bg-white"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {t.promo.poster}
            </div>
          )}

          <div className="absolute top-2.5 right-2.5 pointer-events-none">{statusBadge}</div>

          {packageCount > 0 && (
            <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-black/65 text-white backdrop-blur-sm">
                {t.promo.packageCount.replace("{count}", String(packageCount))}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="min-w-0">
            <h3
              className="font-bold text-sm leading-snug line-clamp-2"
              style={{ color: "var(--text-primary)" }}
            >
              {promo.title}
            </h3>
            {promo.promo_text && (
              <p
                className="text-xs line-clamp-2 mt-1 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {promo.promo_text}
              </p>
            )}
          </div>

          {packageCount > 0 && <PromoDepartureCountdowns promo={promo} compact />}

          <div
            className="mt-auto pt-1 flex items-center justify-between gap-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            {promo.creator ? (
              <p className="text-[10px] truncate flex-1" style={{ color: "var(--text-muted)" }}>
                {t.promo.createdBy}: {(promo.creator as { full_name?: string }).full_name || "—"}
              </p>
            ) : (
              <span className="flex-1" />
            )}

            {canOpenDetail && (
              <span className="text-[10px] font-semibold text-[#3b66ff] inline-flex items-center gap-0.5 shrink-0">
                {t.promo.viewDetails}
                <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </div>

          {canEdit && editHref && (
            <div
              className="flex gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Link
                href={editHref}
                className="btn-secondary text-xs inline-flex items-center gap-1 py-1.5 px-2.5 flex-1 justify-center"
              >
                <Pencil className="w-3 h-3" />
                {t.common.edit}
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(promo.id)}
                  className="btn-secondary text-xs inline-flex items-center gap-1 py-1.5 px-2.5 text-red-500 border-red-200 dark:border-red-900/40"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.common.delete}
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {canOpenDetail && (
        <PromoDetailModal promo={promo} open={detailOpen} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
}
