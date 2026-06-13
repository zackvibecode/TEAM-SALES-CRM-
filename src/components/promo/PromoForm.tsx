"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ImageIcon, MessageSquare, Settings2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { departureRowsToStored, storedToDepartureRows } from "@/lib/promo/countdown";
import { PromoDepartureCountdowns } from "./PromoDepartureCountdowns";
import { PromoDepartureDatesEditor } from "./PromoDepartureDatesEditor";
import { UploadPromoImage } from "./UploadPromoImage";
import type { Promo, PromoDepartureRow } from "@/types/promo";

interface PromoFormProps {
  promo?: Promo;
  basePath: string;
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card card-padded space-y-4">
      <div className="flex items-center gap-2.5 pb-1 border-b" style={{ borderColor: "var(--border-color)" }}>
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ background: "var(--surface-hover)", color: "#3b66ff" }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
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
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <FormSection icon={MessageSquare} title={t.promo.promoText}>
          <textarea
            value={promoText}
            onChange={(e) => setPromoText(e.target.value)}
            rows={3}
            className="input-field w-full resize-none text-sm"
            placeholder={t.promo.promoTextHint}
          />
        </FormSection>

        <FormSection icon={CalendarDays} title={t.promo.departureDates}>
          <p className="text-xs -mt-2" style={{ color: "var(--text-muted)" }}>
            {t.promo.endDateHint}
          </p>
          <PromoDepartureDatesEditor rows={departureRows} onChange={setDepartureRows} />
        </FormSection>

        <FormSection icon={Settings2} title={t.promo.sortOrder}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                {t.promo.sortOrder}
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="input-field w-full text-sm"
              />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                {t.promo.sortOrderHint}
              </p>
            </div>
            <label
              className="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition hover:border-[#3b66ff]/40"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-hover)" }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-[#3b66ff]"
              />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {t.common.active}
              </span>
            </label>
          </div>
        </FormSection>

        <FormSection icon={ImageIcon} title={t.promo.poster}>
          <UploadPromoImage value={posterUrl} onChange={setPosterUrl} title={posterTitle} />
        </FormSection>

        {error && (
          <p className="text-sm text-red-500 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sticky bottom-4 z-10">
          <button type="submit" disabled={saving} className="btn-primary-solid flex-1 sm:flex-none">
            {saving ? t.common.saving : t.common.save}
          </button>
          <button type="button" onClick={() => router.push(basePath)} className="btn-secondary">
            {t.common.cancel}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="surface-card card-padded lg:sticky lg:top-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div
              className="p-1.5 rounded-lg"
              style={{ background: "var(--surface-hover)", color: "#3b66ff" }}
            >
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t.promo.countdown}
            </h3>
          </div>

          {previewEntries.length > 0 ? (
            <>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                <PromoDepartureCountdowns promo={{ departure_dates: previewEntries }} />
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {t.promo.mytNote}
              </p>
            </>
          ) : (
            <p className="text-sm py-6 text-center rounded-xl" style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}>
              {t.promo.endDateHint}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
