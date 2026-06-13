"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  departureRowsToStored,
  storedToDepartureRows,
} from "@/lib/promo/countdown";
import { PromoDepartureCountdowns } from "./PromoDepartureCountdowns";
import { PromoDepartureDatesEditor } from "./PromoDepartureDatesEditor";
import { UploadPromoImage } from "./UploadPromoImage";
import type { Promo, PromoDepartureRow } from "@/types/promo";

interface PromoFormProps {
  promo?: Promo;
  basePath: string;
}

export function PromoForm({ promo, basePath }: PromoFormProps) {
  const router = useRouter();
  const { t } = useAppLocale();
  const [promoText, setPromoText] = useState(promo?.promo_text || "");
  const [posterUrl, setPosterUrl] = useState<string | null>(promo?.poster_url || null);
  const [departureRows, setDepartureRows] = useState<PromoDepartureRow[]>(() =>
    storedToDepartureRows(promo ?? {})
  );
  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(promo?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const previewEntries = departureRowsToStored(departureRows);
  const posterTitle =
    previewEntries.find((entry) => entry.name)?.name || promo?.title || t.promo.poster;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const departure_dates = departureRowsToStored(departureRows);
    const firstName = departure_dates.find((entry) => entry.name)?.name;

    const payload = {
      title: firstName || promo?.title || "Package",
      promo_text: promoText,
      poster_url: posterUrl,
      departure_dates: departureRows
        .filter((row) => row.name.trim() || row.date.trim())
        .map((row) => ({ name: row.name.trim(), date: row.date.trim() })),
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

        <PromoDepartureDatesEditor rows={departureRows} onChange={setDepartureRows} />

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
          <UploadPromoImage value={posterUrl} onChange={setPosterUrl} title={posterTitle} />
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
          {previewEntries.length > 0 ? (
            <>
              <PromoDepartureCountdowns promo={{ departure_dates: previewEntries }} />
              <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                {t.promo.mytNote}
              </p>
            </>
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
