"use client";

import { useEffect } from "react";
import { CalendarDays, User, X } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { isPromoFullyExpired, normalizeDepartureEntries } from "@/lib/promo/countdown";
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
  const packages = normalizeDepartureEntries(promo);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={promo.title}
    >
      <div
        className="surface-card w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {promo.poster_url && (
          <div className="relative shrink-0 p-4 pb-0 flex justify-center bg-[var(--surface-muted)]">
            <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden shadow-md">
              <PromoPosterViewer
                src={promo.poster_url}
                title={promo.title}
                thumbnailClassName="relative w-full h-full aspect-square overflow-hidden bg-white"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/55 text-white hover:bg-black/75 transition z-10"
                aria-label={t.promo.closeViewer}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate" style={{ color: "var(--text-primary)" }}>
                {promo.title}
              </h3>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                  !promo.is_active || isExpired
                    ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {!promo.is_active || isExpired ? t.common.ended : t.common.active}
              </span>
            </div>
            {!promo.poster_url && (
              <button type="button" onClick={onClose} className="btn-ghost p-1.5 shrink-0">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {promo.promo_text && (
            <p className="text-sm leading-relaxed rounded-xl px-3 py-2.5" style={{ color: "var(--text-secondary)", background: "var(--surface-hover)" }}>
              {promo.promo_text}
            </p>
          )}

          {packages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#3b66ff]" />
                <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {t.promo.departureDates}
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    ({t.promo.packageCount.replace("{count}", String(packages.length))})
                  </span>
                </h4>
              </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                <PromoDepartureCountdowns promo={promo} />
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {t.promo.mytNote}
              </p>
            </div>
          )}

          {promo.creator && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <User className="w-3.5 h-3.5 shrink-0" />
              {t.promo.createdBy}: {(promo.creator as { full_name?: string }).full_name || "—"}
            </p>
          )}

          <button type="button" onClick={onClose} className="btn-secondary text-sm w-full">
            {t.promo.closeViewer}
          </button>
        </div>
      </div>
    </div>
  );
}
