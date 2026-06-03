"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addDays, in3Days, nextWeek, tomorrow } from "@/lib/follow-up/dates";

type Preset = "tomorrow" | "3days" | "week" | "custom" | "none";

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

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="card rounded-2xl w-full max-w-md shadow-xl p-6">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {(
            [
              ["tomorrow", "Tomorrow"],
              ["3days", "In 3 days"],
              ["week", "Next week"],
              ["custom", "Custom date"],
              ...(showSkip ? [["none", "No next follow up"] as const] : []),
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                name="preset"
                checked={preset === key}
                onChange={() => setPreset(key as Preset)}
              />
              {label}
            </label>
          ))}
        </div>

        {preset === "custom" && (
          <input
            type="date"
            className="input-field mb-3"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={addDays(new Date(), 0)}
          />
        )}

        <textarea
          className="input-field mb-4 min-h-[80px]"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-xl py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || (preset === "custom" && !customDate)}
            onClick={handleSubmit}
            className="flex-1 btn-primary-solid"
          >
            {loading ? "..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
