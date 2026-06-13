"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { isoToMytDateInput } from "@/lib/promo/countdown";
import { UploadPromoImage } from "./UploadPromoImage";
import { PromoCountdown } from "./PromoCountdown";
import type { Promo } from "@/types/promo";

interface PromoFormProps {
  promo?: Promo;
  basePath: string;
}

export function PromoForm({ promo, basePath }: PromoFormProps) {
  const router = useRouter();
  const { t } = useAppLocale();
  const [title, setTitle] = useState(promo?.title || "");
  const [promoText, setPromoText] = useState(promo?.promo_text || "");
  const [posterUrl, setPosterUrl] = useState<string | null>(promo?.poster_url || null);
  const [endsAtDate, setEndsAtDate] = useState(isoToMytDateInput(promo?.ends_at));
  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(promo?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewEndsAt = endsAtDate ? `${endsAtDate}T23:59:59+08:00` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      promo_text: promoText,
      poster_url: posterUrl,
      ends_at: endsAtDate || null,
      is_active: isActive,
      sort_order: sortOrder,
    };

    try {
      const url = promo ? `/api/promos?id=${promo.id}` : "/api/promos";
      const res = await fetch(url, {
        method: promo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push(basePath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            {t.promo.promoTitle} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-field w-full"
            placeholder={t.promo.promoTitle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            {t.promo.promoText}
          </label>
          <textarea
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            rows={3}
            className="input-field w-full resize-none"
            placeholder={t.promo.promoTextHint}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            {t.promo.endDate}
          </label>
          <input
            type="date"
            value={endsAtDate}
            onChange={(e) => setEndsAtDate(e.target.value)}
            className="input-field w-full"
          />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {t.promo.endDateHint}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              {t.promo.sortOrder}
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="input-field w-full"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {t.promo.sortOrderHint}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm" style={{ color: "var(--text-primary)" }}>
              {t.common.active}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            {t.promo.poster}
          </label>
          <UploadPromoImage value={posterUrl} onChange={setPosterUrl} title={title || t.promo.poster} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary-solid">
            {saving ? t.common.saving : t.common.save}
          </button>
          <button type="button" onClick={() => router.push(basePath)} className="btn-secondary">
            {t.common.cancel}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="surface-card card-padded">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            {t.promo.countdown}
          </h3>
          {previewEndsAt ? (
            <PromoCountdown
              endsAt={new Date(`${endsAtDate}T23:59:59+08:00`).toISOString()}
              showMytNote
            />
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.promo.endDateHint}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
