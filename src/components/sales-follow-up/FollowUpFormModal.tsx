"use client";

import { useState, type FormEvent } from "react";
import { X, Loader2, Calendar, MessageSquare, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayKL } from "@/lib/sales-follow-up/dates";
import type { CreateFollowUpInput } from "@/lib/sales-follow-up/types";
import { FOLLOW_UP_STATUS_OPTIONS } from "@/lib/sales-follow-up/types";

interface FollowUpFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateFollowUpInput) => Promise<void>;
  leadId: string;
  leadName: string;
  currentFollowUpCount: number;
}

export function FollowUpFormModal({
  open,
  onClose,
  onSave,
  leadId,
  leadName,
  currentFollowUpCount,
}: FollowUpFormModalProps) {
  const nextNumber = currentFollowUpCount + 1;
  const [followUpDate, setFollowUpDate] = useState(todayKL());
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("No Response");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const followUpLabel =
    nextNumber <= 3 ? `Follow-Up ${nextNumber}` : `Follow-Up ${nextNumber}`;

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!followUpDate) {
      setError("Tarikh follow-up diperlukan.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        lead_id: leadId,
        follow_up_date: followUpDate,
        response: response.trim() || undefined,
        status: status as CreateFollowUpInput["status"],
        notes: notes.trim() || undefined,
        next_follow_up_date: nextFollowUpDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan follow-up.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 surface-card rounded-2xl w-full max-w-md mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div
          className="sticky top-0 z-10 surface-card flex items-center justify-between px-6 py-4 border-b rounded-t-2xl"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-card)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: nextNumber <= 3 ? "var(--color-brand-100, #e8f5d1)" : "var(--color-success-100, #dcfce7)",
                  color: nextNumber <= 3 ? "var(--color-brand-700, #3d6b00)" : "var(--color-success-700, #15803d)",
                }}
              >
                {followUpLabel}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {leadName || "Lead"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: "var(--color-error-50, #fef2f2)",
                color: "var(--color-error-600, #dc2626)",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Tarikh Follow-Up <span style={{ color: "var(--color-error-500, #ef4444)" }}>*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
                className="input-field pl-10 w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field w-full text-sm"
            >
              {FOLLOW_UP_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Respon
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 size-4" style={{ color: "var(--text-muted)" }} />
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Apa respon pelanggan?"
                rows={2}
                className="input-field pl-10 w-full text-sm resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Nota
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 size-4" style={{ color: "var(--text-muted)" }} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nota tambahan..."
                rows={3}
                className="input-field pl-10 w-full text-sm resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Tarikh Follow-Up Seterusnya
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="input-field w-full text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className={cn("btn-primary-solid flex-1 flex items-center justify-center gap-2", saving && "opacity-70")}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan Follow-Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
