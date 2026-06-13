"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
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
  const { t } = useAppLocale();
  const [items, setItems] = useState(promos);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      {showNewButton && (
        <div className="flex justify-end">
          <Link href={`${basePath}/new`} className="btn-primary-solid text-sm">
            + {t.promo.newPromo}
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card-padded text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t.promo.noPromos}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              editHref={canModify(promo) ? `${basePath}/${promo.id}/edit` : undefined}
              canEdit={canModify(promo)}
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
