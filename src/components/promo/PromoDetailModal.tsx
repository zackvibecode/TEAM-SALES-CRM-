"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { isPromoFullyExpired } from "@/lib/promo/countdown";
import { PromoDepartureCountdowns } from "./PromoDepartureCountdowns";
import { PromoPosterViewer } from "./PromoPosterViewer";
import type { Promo } from "@/types/promo";

interface PromoDetailModalProps {
  promo: Promo;
  open: boolean;
  onClose: () => void;
}

export function PromoDetailModal({ promo, open, onClose }: PromoDetailModalProps) {
  const { t } = useAppLocale();
  const isExpired = isPromoFullyExpired(promo);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={promo.title}
    >
      <div
        className="surface-card w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate" style={{ color: "var(--text-primary)" }}>
              {promo.title}
            </h3>
            <span
              className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                !promo.is_active || isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {!promo.is_active || isExpired ? t.common.ended : t.common.active}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-1.5 shrink-0"
            aria-label={t.promo.closeViewer}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {promo.poster_url && (
          <PromoPosterViewer
            src={promo.poster_url}
            title={promo.title}
            thumbnailClassName="relative mx-auto w-full max-w-xs aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-white"
          />
        )}

        {promo.promo_text && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {promo.promo_text}
          </p>
        )}

        <PromoDepartureCountdowns promo={promo} />

        {promo.creator && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t.promo.createdBy}: {(promo.creator as { full_name?: string }).full_name || "—"}
          </p>
        )}

        <button type="button" onClick={onClose} className="btn-secondary text-sm w-full">
          {t.promo.closeViewer}
        </button>
      </div>
    </div>
  );
}
