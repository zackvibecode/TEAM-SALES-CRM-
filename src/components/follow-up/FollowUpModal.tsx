"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, in3Days, nextWeek, tomorrow } from "@/lib/follow-up/dates";

type Preset = "tomorrow" | "3days" | "week" | "custom" | "none";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "tomorrow", label: "Tomorrow" },
  { key: "3days", label: "In 3 days" },
  { key: "week", label: "Next week" },
  { key: "custom", label: "Custom date" },
];

export function FollowUpModal({
  open,
  title,
  subtitle,
  onClose,
  onConfirm,
  showSkip,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm: (date: string | null, note: string) => Promise<void>;
  showSkip?: boolean;
}) {
  const [preset, setPreset] = useState<Preset>("tomorrow");
  const [customDate, setCustomDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const resolveDate = (): string | null => {
    if (preset === "none") return null;
    if (preset === "tomorrow") return tomorrow();
    if (preset === "3days") return in3Days();
    if (preset === "week") return nextWeek();
    return customDate || tomorrow();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(resolveDate(), note);
      onClose();
      setNote("");
    } finally {
      setLoading(false);
    }
  };

  const allPresets = showSkip
    ? [...PRESETS, { key: "none" as Preset, label: "Skip for now" }]
    : PRESETS;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="card rounded-2xl w-full max-w-md shadow-xl p-6">
        <div className="flex justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          When to follow up
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {allPresets.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPreset(key)}
              className={cn(
                "px-3 py-2.5 text-sm font-semibold rounded-xl border transition",
                preset === key ? "filter-pill-active" : "filter-pill"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <input
            type="date"
            className="input-field mb-4"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={addDays(new Date(), 0)}
          />
        )}

        <textarea
          className="input-field mb-5 min-h-[80px]"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || (preset === "custom" && !customDate)}
            onClick={handleSubmit}
            className="btn-primary-solid flex-1 py-2.5 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
