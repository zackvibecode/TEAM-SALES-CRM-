"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RotateCcw, Save } from "lucide-react";
import { WHATSAPP_PRETEXT_MAX_LENGTH } from "@/lib/whatsapp-pretext";

export function WhatsAppPretextEditor() {
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const maxLength = WHATSAPP_PRETEXT_MAX_LENGTH;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/whatsapp-pretext", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const pretext = data.pretext as string | null;
      setSaved(pretext);
      setDraft(pretext ?? "");
      if (typeof data.maxLength === "number" && data.maxLength !== WHATSAPP_PRETEXT_MAX_LENGTH) {
        console.warn(
          `API maxLength=${data.maxLength} but app expects ${WHATSAPP_PRETEXT_MAX_LENGTH}. Redeploy or restart dev server.`
        );
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile/whatsapp-pretext", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pretext: draft.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      const pretext = data.pretext as string | null;
      setSaved(pretext);
      setDraft(pretext ?? "");
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to save");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setDraft("");
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/profile/whatsapp-pretext", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pretext: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear");
      setSaved(null);
      setDraft("");
      setStatus("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to clear");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = (draft.trim() || null) !== (saved?.trim() || null);
  const savedEmpty = !saved?.trim();

  if (loading) {
    return <div className="card-padded animate-pulse h-64 rounded-2xl" />;
  }

  return (
    <div className="card-padded space-y-5 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="icon-stat w-10 h-10 shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            WhatsApp opening message
            <span
              className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
              style={{ background: "var(--surface-elevated)", color: "var(--text-muted)" }}
            >
              Optional · Max {maxLength} characters
            </span>
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Optionally pre-fill a message when you open WhatsApp from leads and follow-ups. Leave
            this blank to open chats with no pre-written text. You can paste emojis, links, and any
            wording you prefer.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="whatsapp-pretext" className="text-sm font-medium block mb-2" style={{ color: "var(--text-secondary)" }}>
          Your message
        </label>
        <textarea
          id="whatsapp-pretext"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          maxLength={maxLength}
          placeholder="Leave empty to open WhatsApp without a pre-filled message"
          className="input-field w-full resize-y min-h-[140px]"
        />
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Use <code className="text-xs">{"{name}"}</code> where the customer&apos;s name should appear.
          Emojis and URLs work when pasted. Very long or emoji-heavy text may be shortened by WhatsApp
          when the chat opens.
          <span className="ml-2">
            {draft.length}/{maxLength}
          </span>
        </p>
      </div>

      {status === "success" && (
        <p className="text-sm text-emerald-600">
          {savedEmpty
            ? "Saved. WhatsApp will open without a pre-filled message."
            : "Saved. Your next WhatsApp opens will use this message."}
        </p>
      )}
      {status === "error" && errorMsg && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-primary-solid inline-flex items-center gap-2 min-h-[44px] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save message"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={saving || (!saved && !draft.trim())}
          className="btn-secondary inline-flex items-center gap-2 min-h-[44px] disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Clear message
        </button>
      </div>

      {savedEmpty && !draft.trim() && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No message saved — WhatsApp opens with an empty chat box.
        </p>
      )}
    </div>
  );
}
