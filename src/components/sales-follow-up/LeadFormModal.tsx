"use client";

import { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, Phone, User, MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { getLeadStatusOptions } from "@/lib/sales-follow-up/labels";
import type { SalesPic, SalesLead, CreateLeadInput } from "@/lib/sales-follow-up/types";

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateLeadInput) => Promise<void>;
  pics: SalesPic[];
  editLead?: SalesLead | null;
  lockPic?: boolean;
}

export function LeadFormModal({ open, onClose, onSave, pics, editLead, lockPic = false }: LeadFormModalProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const leadStatusOptions = getLeadStatusOptions(sf);

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [source, setSource] = useState("");
  const [assignedPicId, setAssignedPicId] = useState("");
  const [leadStatus, setLeadStatus] = useState("New");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editLead) {
      setCustomerName(editLead.customer_name || "");
      setPhoneNumber(editLead.phone_number || "");
      setDestination(editLead.destination_or_product || "");
      setSource(editLead.source || "");
      setAssignedPicId(editLead.assigned_pic_id || "");
      setLeadStatus(editLead.lead_status || "New");
      setNextFollowUpDate(editLead.next_follow_up_date || "");
      setNotes("");
    } else {
      setCustomerName("");
      setPhoneNumber("");
      setDestination("");
      setSource("");
      setAssignedPicId(lockPic && pics[0]?.id ? pics[0].id : "");
      setLeadStatus("New");
      setNextFollowUpDate("");
      setNotes("");
    }
    setError("");
  }, [open, editLead, lockPic, pics]);

  if (!open) return null;

  const isEdit = !!editLead;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!phoneNumber.trim()) {
      setError(sf.phoneRequired);
      return;
    }

    const normalized = formatWhatsAppNumber(phoneNumber.trim());
    if (normalized.length < 10) {
      setError(sf.phoneInvalid);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim(),
        destination_or_product: destination.trim(),
        source: source.trim(),
        assigned_pic_id: assignedPicId || undefined,
        lead_status: leadStatus as CreateLeadInput["lead_status"],
        next_follow_up_date: nextFollowUpDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : sf.saveFail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 surface-card rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div
          className="sticky top-0 z-10 surface-card flex items-center justify-between px-6 py-4 border-b rounded-t-2xl"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-card)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {isEdit ? sf.editLeadTitle : sf.addLeadTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {isEdit ? sf.editLeadSubtitle : sf.addLeadSubtitle}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.customerName}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={sf.customerNamePlaceholder}
                  className="input-field pl-10 w-full text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.phoneNumber} <span style={{ color: "var(--color-error-500, #ef4444)" }}>*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={sf.phonePlaceholder}
                  required
                  className="input-field pl-10 w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.destinationProduct}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={sf.destinationPlaceholder}
                  className="input-field pl-10 w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.source}
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={sf.sourcePlaceholder}
                  className="input-field pl-10 w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.assignPic} <span style={{ color: "var(--color-error-500, #ef4444)" }}>*</span>
              </label>
              <select
                value={assignedPicId}
                onChange={(e) => setAssignedPicId(e.target.value)}
                className="input-field w-full text-sm"
                disabled={lockPic}
              >
                <option value="">{sf.selectPic}</option>
                {pics.map((pic) => (
                  <option key={pic.id} value={pic.id}>
                    {pic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.leadStatus}
              </label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value)}
                className="input-field w-full text-sm"
              >
                {leadStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.nextFollowUpDate}
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="input-field w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              {sf.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={sf.notesPlaceholder}
              rows={3}
              className="input-field w-full text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              {sf.cancel}
            </button>
            <button
              type="submit"
              className={cn("btn-primary-solid flex-1 flex items-center justify-center gap-2", saving && "opacity-70")}
              disabled={saving}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? sf.saveChanges : sf.saveLead}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
