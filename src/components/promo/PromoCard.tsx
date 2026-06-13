"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { getPromoCountdown } from "@/lib/promo/countdown";
import { PromoCountdown } from "./PromoCountdown";
import { PromoPosterViewer } from "./PromoPosterViewer";
import type { Promo } from "@/types/promo";

interface PromoCardProps {
  promo: Promo;
  editHref?: string;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
}

export function PromoCard({
  promo,
  editHref,
  canEdit = false,
  onDelete,
}: PromoCardProps) {
  const { locale, t } = useAppLocale();
  const countdown = getPromoCountdown(promo.ends_at, locale);
  const isExpired = countdown?.expired;

  return (
    <div className="surface-card overflow-hidden card-padded">
      <div className="flex gap-4">
        <PromoPosterViewer src={promo.poster_url} title={promo.title} />

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

          {promo.ends_at && <PromoCountdown endsAt={promo.ends_at} />}

          {promo.creator && (
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {t.promo.createdBy}: {(promo.creator as { full_name?: string }).full_name || "—"}
            </p>
          )}

          {canEdit && editHref && (
            <div className="flex gap-2 pt-1">
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
        </div>
      </div>
    </div>
  );
}
