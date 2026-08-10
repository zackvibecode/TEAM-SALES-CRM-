"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RotateCcw, Save, X } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  SFU_WA_TEMPLATES,
  SFU_WA_TEMPLATE_MAX_LENGTH,
  type SfuWaTemplates,
} from "@/lib/sales-follow-up/whatsapp-messages";

interface SfuWaTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (templates: SfuWaTemplates) => void;
}

export function SfuWaTemplatesModal({ open, onClose, onSaved }: SfuWaTemplatesModalProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;

  const [draft1, setDraft1] = useState("");
  const [draft2, setDraft2] = useState("");
  const [draft3, setDraft3] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [setupHint, setSetupHint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSetupHint(false);
    try {
      const res = await fetch("/api/profile/sfu-wa-templates", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || sf.waLoadFail);
      const templates = (data.templates || {}) as SfuWaTemplates;
      const defaults = (data.defaults || SFU_WA_TEMPLATES) as typeof SFU_WA_TEMPLATES;
      setDraft1(templates["1"] ?? defaults["1"]);
      setDraft2(templates["2"] ?? defaults["2"]);
      setDraft3(templates["3"] ?? defaults["3"]);
      if (data.setupRequired) setSetupHint(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : sf.waLoadFail);
      setDraft1(SFU_WA_TEMPLATES["1"]);
      setDraft2(SFU_WA_TEMPLATES["2"]);
      setDraft3(SFU_WA_TEMPLATES["3"]);
    } finally {
      setLoading(false);
    }
  }, [sf.waLoadFail]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const templates: SfuWaTemplates = {
        "1": draft1.trim() || undefined,
        "2": draft2.trim() || undefined,
        "3": draft3.trim() || undefined,
      };
      const res = await fetch("/api/profile/sfu-wa-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || sf.waSaveFail);
      onSaved?.(data.templates || templates);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : sf.waSaveFail);
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setDraft1(SFU_WA_TEMPLATES["1"]);
    setDraft2(SFU_WA_TEMPLATES["2"]);
    setDraft3(SFU_WA_TEMPLATES["3"]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={sf.cancel}
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl surface-card p-5 space-y-4"
        style={{ backgroundColor: "var(--surface-card)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MessageCircle className="size-5" />
              {sf.waEditTitle}
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {sf.waEditHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-muted)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="size-4" />
          </button>
        </div>

        {setupHint && (
          <p className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {sf.waSetupHint}
          </p>
        )}

        {loading ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            {sf.loadingData}
          </p>
        ) : (
          <div className="space-y-4">
            <TemplateField
              label={sf.waFu1}
              value={draft1}
              onChange={setDraft1}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
            />
            <TemplateField
              label={sf.waFu2}
              value={draft2}
              onChange={setDraft2}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
            />
            <TemplateField
              label={sf.waFu3}
              value={draft3}
              onChange={setDraft3}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={loading || saving}
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
          >
            <RotateCcw className="size-3.5" />
            {sf.waResetDefaults}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving}
            className="btn-primary-solid inline-flex items-center gap-1.5 text-sm"
          >
            <Save className="size-3.5" />
            {saving ? sf.followUpSaving : sf.waSave}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateField({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={3}
        className="input-field w-full text-sm resize-y"
        style={{ minHeight: "72px" }}
      />
    </div>
  );
}
