"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import {
  SFU_WA_TEMPLATES,
  SFU_WA_TEMPLATE_MAX_LENGTH,
  SFU_WA_VARS,
  type SfuWaTemplates,
} from "@/lib/sales-follow-up/whatsapp-messages";

const DRAG_MIME = "application/x-sfu-wa-var";

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
  const [activeField, setActiveField] = useState<1 | 2 | 3>(1);
  const [dragOverField, setDragOverField] = useState<1 | 2 | 3 | null>(null);

  const ref1 = useRef<HTMLTextAreaElement>(null);
  const ref2 = useRef<HTMLTextAreaElement>(null);
  const ref3 = useRef<HTMLTextAreaElement>(null);

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

  function insertToken(field: 1 | 2 | 3, token: string, atIndex?: number) {
    const getters = { 1: draft1, 2: draft2, 3: draft3 } as const;
    const setters = { 1: setDraft1, 2: setDraft2, 3: setDraft3 } as const;
    const refs = { 1: ref1, 2: ref2, 3: ref3 } as const;
    const current = getters[field];
    const el = refs[field].current;
    const start =
      typeof atIndex === "number"
        ? atIndex
        : el?.selectionStart ?? current.length;
    const end = typeof atIndex === "number" ? atIndex : el?.selectionEnd ?? start;
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`.slice(
      0,
      SFU_WA_TEMPLATE_MAX_LENGTH
    );
    setters[field](next);
    requestAnimationFrame(() => {
      const node = refs[field].current;
      if (!node) return;
      const pos = Math.min(start + token.length, next.length);
      node.focus();
      node.setSelectionRange(pos, pos);
    });
  }

  function handleChipClick(token: string) {
    insertToken(activeField, token);
  }

  function handleChipDragStart(e: React.DragEvent, token: string) {
    e.dataTransfer.setData(DRAG_MIME, token);
    e.dataTransfer.setData("text/plain", token);
    e.dataTransfer.effectAllowed = "copy";
  }

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

  const varLabels: Record<(typeof SFU_WA_VARS)[number]["labelKey"], string> = {
    waVarName: sf.waVarName,
    waVarPackage: sf.waVarPackage,
  };

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

        <div
          className="rounded-xl border px-3 py-2.5 space-y-2"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-muted)" }}
        >
          <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {sf.waVarHint}
          </p>
          <div className="flex flex-wrap gap-2">
            {SFU_WA_VARS.map((v) => (
              <button
                key={v.token}
                type="button"
                draggable
                onDragStart={(e) => handleChipDragStart(e, v.token)}
                onClick={() => handleChipClick(v.token)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing select-none"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-primary)",
                }}
                title={varLabels[v.labelKey]}
              >
                <span className="font-mono">{v.token}</span>
                <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                  {varLabels[v.labelKey]}
                </span>
              </button>
            ))}
          </div>
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
              field={1}
              label={sf.waFu1}
              value={draft1}
              onChange={setDraft1}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
              textareaRef={ref1}
              active={activeField === 1}
              dragOver={dragOverField === 1}
              onFocusField={() => setActiveField(1)}
              onDragOverField={setDragOverField}
              onInsert={(token, at) => insertToken(1, token, at)}
            />
            <TemplateField
              field={2}
              label={sf.waFu2}
              value={draft2}
              onChange={setDraft2}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
              textareaRef={ref2}
              active={activeField === 2}
              dragOver={dragOverField === 2}
              onFocusField={() => setActiveField(2)}
              onDragOverField={setDragOverField}
              onInsert={(token, at) => insertToken(2, token, at)}
            />
            <TemplateField
              field={3}
              label={sf.waFu3}
              value={draft3}
              onChange={setDraft3}
              maxLength={SFU_WA_TEMPLATE_MAX_LENGTH}
              textareaRef={ref3}
              active={activeField === 3}
              dragOver={dragOverField === 3}
              onFocusField={() => setActiveField(3)}
              onDragOverField={setDragOverField}
              onInsert={(token, at) => insertToken(3, token, at)}
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
  field,
  label,
  value,
  onChange,
  maxLength,
  textareaRef,
  active,
  dragOver,
  onFocusField,
  onDragOverField,
  onInsert,
}: {
  field: 1 | 2 | 3;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  active: boolean;
  dragOver: boolean;
  onFocusField: () => void;
  onDragOverField: (f: 1 | 2 | 3 | null) => void;
  onInsert: (token: string, atIndex?: number) => void;
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
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        onFocus={onFocusField}
        onDragEnter={(e) => {
          e.preventDefault();
          onDragOverField(field);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          onDragOverField(field);
        }}
        onDragLeave={() => onDragOverField(null)}
        onDrop={(e) => {
          e.preventDefault();
          onDragOverField(null);
          const token =
            e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
          if (!token.startsWith("{")) return;
          onFocusField();
          const el = textareaRef.current;
          const at = el?.selectionStart;
          onInsert(token, typeof at === "number" ? at : undefined);
        }}
        rows={3}
        className={cn(
          "input-field w-full text-sm resize-y transition ring-offset-0",
          dragOver && "ring-2 ring-[var(--color-info-500,#3b82f6)]",
          active && !dragOver && "border-[var(--text-muted)]"
        )}
        style={{ minHeight: "72px" }}
      />
    </div>
  );
}
