"use client";

import { Plus, Trash2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { PromoDepartureRow } from "@/types/promo";

interface PromoDepartureDatesEditorProps {
  rows: PromoDepartureRow[];
  onChange: (rows: PromoDepartureRow[]) => void;
}

export function PromoDepartureDatesEditor({ rows, onChange }: PromoDepartureDatesEditorProps) {
  const { t } = useAppLocale();
  const list = rows.length > 0 ? rows : [{ name: "", date: "" }];

  const updateRow = (index: number, patch: Partial<PromoDepartureRow>) => {
    const next = list.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const removeRow = (index: number) => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ name: "", date: "" }]);
  };

  const addRow = () => {
    onChange([...list, { name: "", date: "" }]);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {list.map((row, index) => (
          <div
            key={index}
            className="rounded-xl border p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
            style={{ borderColor: "var(--border-color)", background: "var(--surface-hover)" }}
          >
            <span
              className="hidden sm:flex w-7 h-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
              style={{ background: "var(--surface-card)", color: "var(--text-muted)" }}
            >
              {index + 1}
            </span>

            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(index, { name: e.target.value })}
              className="input-field w-full sm:flex-1 text-sm"
              placeholder={t.promo.packageNameHint}
              aria-label={`${t.promo.packageName} ${index + 1}`}
            />

            <div className="flex items-center gap-2 sm:w-44 shrink-0">
              <input
                type="date"
                value={row.date}
                onChange={(e) => updateRow(index, { date: e.target.value })}
                className="input-field w-full text-base font-semibold min-h-11"
                aria-label={`${t.promo.endDate} ${index + 1}`}
              />
              {list.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="p-2 rounded-lg shrink-0 transition hover:bg-red-500/10 text-red-500"
                  aria-label={t.promo.removeDepartureDate}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full btn-secondary text-sm inline-flex items-center justify-center gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        {t.promo.addPackageDate}
      </button>
    </div>
  );
}
