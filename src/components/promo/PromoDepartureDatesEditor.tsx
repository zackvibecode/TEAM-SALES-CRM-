"use client";

import { Plus, X } from "lucide-react";
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
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
          {t.promo.departureDates}
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {t.promo.endDateHint}
        </p>
      </div>

      <div className="space-y-2">
        {list.map((row, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={row.name}
              onChange={(e) => updateRow(index, { name: e.target.value })}
              className="input-field w-full sm:flex-1"
              placeholder={t.promo.packageNameHint}
              aria-label={`${t.promo.packageName} ${index + 1}`}
            />
            <div className="flex items-center gap-2 sm:w-[11rem] shrink-0">
              <input
                type="date"
                value={row.date}
                onChange={(e) => updateRow(index, { date: e.target.value })}
                className="input-field w-full"
                aria-label={`${t.promo.endDate} ${index + 1}`}
              />
              {list.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="btn-secondary p-2 shrink-0"
                  aria-label={t.promo.removeDepartureDate}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="btn-secondary text-sm inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {t.promo.addPackageDate}
      </button>
    </div>
  );
}
