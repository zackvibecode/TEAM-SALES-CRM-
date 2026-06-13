"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Trash2, Check, X, ImageIcon } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { formatDate } from "@/lib/i18n/format";
import type { Promo } from "@/types/promo";

interface PackageCardProps {
  promo: Promo;
  basePath: string;
  onDelete: (id: string) => void;
  onUpdateSeats: (id: string, seats: number) => void;
}

export function PackageCard({ promo, basePath, onDelete, onUpdateSeats }: PackageCardProps) {
  const router = useRouter();
  const { t, locale } = useAppLocale();
  const [editingSeats, setEditingSeats] = useState(false);
  const [seatsValue, setSeatsValue] = useState(promo.seats_left ?? 0);
  const [deleting, setDeleting] = useState(false);

  const imageSrc = promo.image_url || promo.poster_url;
  const destination = promo.destination || "-";

  const handleSaveSeats = () => {
    onUpdateSeats(promo.id, seatsValue);
    setEditingSeats(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(t.admin.packages.deleteConfirm)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/promos?id=${promo.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(promo.id);
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const departureDates = Array.isArray(promo.departure_dates)
    ? promo.departure_dates
    : [];

  return (
    <div
      className="surface-card rounded-lg overflow-hidden transition hover:border-[#3b66ff]/30"
      style={{ borderColor: "var(--border-color)" }}
    >
      {/* Image Section - Square */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--surface-muted)]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={destination}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t.admin.packages.noImage}
            </span>
          </div>
        )}
        {/* Status Badge - overlay top-right */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: promo.is_active ? "#10b981" : "var(--surface-muted)",
              color: promo.is_active ? "#fff" : "var(--text-muted)",
              border: promo.is_active ? "none" : "1px solid var(--border-color)",
            }}
          >
            {promo.is_active ? t.common.active : t.common.inactive}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Destination Name */}
        <h3
          className="font-bold text-sm truncate"
          style={{ color: "var(--text-primary)" }}
          title={destination}
        >
          {destination}
        </h3>

        {/* Departure Dates - BIG & PROMINENT */}
        {departureDates.length > 0 && (
          <div className="space-y-1.5">
            {departureDates.slice(0, 3).map((entry, idx) => {
              const entryObj =
                typeof entry === "string"
                  ? { name: "", date: entry }
                  : entry;
              const displayDate = entryObj.date
                ? formatDate(entryObj.date, locale)
                : "";
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                  style={{
                    background: "var(--surface-hover)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <CalendarDays
                    className="w-5 h-5 shrink-0"
                    style={{ color: "#3b66ff" }}
                  />
                  <div className="min-w-0">
                    {entryObj.name && (
                      <p
                        className="text-[11px] leading-tight truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {entryObj.name}
                      </p>
                    )}
                    <p
                      className="text-sm font-bold leading-tight truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {displayDate || "-"}
                    </p>
                  </div>
                </div>
              );
            })}
            {departureDates.length > 3 && (
              <p
                className="text-[11px] px-1"
                style={{ color: "var(--text-muted)" }}
              >
                +{departureDates.length - 3} more dates
              </p>
            )}
          </div>
        )}

        {departureDates.length === 0 && (
          <div
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
            style={{
              background: "var(--surface-hover)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CalendarDays
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t.admin.packages.departureDate}
            </p>
          </div>
        )}

        {/* Seat Left - Editable */}
        <div
          className="flex items-center justify-between px-2.5 py-2 rounded-lg"
          style={{
            background: "var(--surface-hover)",
            border: "1px solid var(--border-color)",
          }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {t.admin.packages.seatLeft}
          </span>
          {editingSeats ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={seatsValue}
                onChange={(e) => setSeatsValue(Number(e.target.value))}
                className="w-16 text-sm font-bold text-center rounded-md py-0.5 input-field"
                style={{ color: "var(--text-primary)" }}
                autoFocus
                min={0}
              />
              <button
                type="button"
                onClick={handleSaveSeats}
                className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                style={{ color: "#10b981" }}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeatsValue(promo.seats_left ?? 0);
                  setEditingSeats(false);
                }}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                style={{ color: "#ef4444" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingSeats(true)}
              className="text-sm font-bold hover:underline"
              style={{ color: "var(--text-primary)" }}
            >
              {seatsValue}
            </button>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div
        className="flex items-center border-t px-4 py-2.5 gap-2"
        style={{ borderColor: "var(--border-color)" }}
      >
        <button
          type="button"
          onClick={() => router.push(`${basePath}/${promo.id}/edit`)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition flex-1 justify-center hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Pencil className="w-3.5 h-3.5" />
          {t.common.edit}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
          style={{ color: "#ef4444" }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleting ? "..." : t.common.delete}
        </button>
      </div>
    </div>
  );
}
