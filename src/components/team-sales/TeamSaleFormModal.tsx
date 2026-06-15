"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { TeamSale } from "@/types";

interface TeamSaleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { package_name: string; lead_source: string; sale_amount: number; notes: string; sales_user_id?: string }) => Promise<void>;
  editing?: TeamSale | null;
  isAdmin?: boolean;
  salesUsers?: { id: string; full_name: string }[];
  labels: {
    addSale: string;
    editSale: string;
    packageName: string;
    leadSource: string;
    saleAmount: string;
    notes: string;
    salesPerson: string;
    save: string;
    cancel: string;
  };
}

export function TeamSaleFormModal({
  open,
  onClose,
  onSave,
  editing,
  isAdmin,
  salesUsers,
  labels,
}: TeamSaleFormModalProps) {
  const [packageName, setPackageName] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [salesUserId, setSalesUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (editing) {
      setPackageName(editing.package_name);
      setLeadSource(editing.lead_source);
      setSaleAmount(editing.sale_amount.toString());
      setNotes(editing.notes);
      setSalesUserId(editing.sales_user_id);
    } else {
      setPackageName("");
      setLeadSource("");
      setSaleAmount("");
      setNotes("");
      setSalesUserId("");
    }
    setError("");
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!packageName.trim()) {
      setError("Package name is required");
      return;
    }

    const amount = parseFloat(saleAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid sale amount");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        package_name: packageName.trim(),
        lead_source: leadSource.trim(),
        sale_amount: amount,
        notes: notes.trim(),
        ...(salesUserId ? { sales_user_id: salesUserId } : {}),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? labels.editSale : labels.addSale}
    >
      <div
        className="surface-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {editing ? labels.editSale : labels.addSale}
          </h3>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          {error && (
            <div className="alert-error text-sm">{error}</div>
          )}

          {isAdmin && salesUsers && salesUsers.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {labels.salesPerson}
              </label>
              <select
                value={salesUserId}
                onChange={(e) => setSalesUserId(e.target.value)}
                className="input-field"
                required={!editing}
                disabled={!!editing}
              >
                <option value="">Select sales user</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {labels.packageName}
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="input-field"
              placeholder="e.g. Umrah 12H September"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {labels.leadSource}
            </label>
            <input
              type="text"
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="input-field"
              placeholder="e.g. Facebook Ads, Walk-in"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {labels.saleAmount} (RM)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
              {labels.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {labels.cancel}
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : labels.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
