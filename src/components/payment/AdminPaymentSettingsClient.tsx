"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { PaymentSettings } from "@/types/payment";

export function AdminPaymentSettingsClient() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    plan_name: "PRO",
    plan_price: "150",
    subscription_duration_days: "30",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    invoice_issuer_name: "MUHAMMAD ZARUL ZAQ'WAN BIN NASARUDDIN",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payment-settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      const s = json.settings as PaymentSettings;
      setSettings(s);
      setForm({
        plan_name: s.plan_name,
        plan_price: String(s.plan_price),
        subscription_duration_days: String(s.subscription_duration_days),
        bank_name: s.bank_name || "",
        bank_account_name: s.bank_account_name || "",
        bank_account_number: s.bank_account_number || "",
        invoice_issuer_name:
          s.invoice_issuer_name || "MUHAMMAD ZARUL ZAQ'WAN BIN NASARUDDIN",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_name: form.plan_name,
          plan_price: Number(form.plan_price),
          subscription_duration_days: Number(form.subscription_duration_days),
          bank_name: form.bank_name,
          bank_account_name: form.bank_account_name,
          bank_account_number: form.bank_account_number,
          invoice_issuer_name: form.invoice_issuer_name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSettings(json.settings);
      setSuccess("Payment settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadQr(file: File) {
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/payment-settings/qr-upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setSettings((prev) =>
        prev ? { ...prev, qr_code_url: json.url } : prev
      );
      setSuccess("QR code updated.");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-shell flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="dashboard-shell space-y-5">
      <PageHeader
        badge="Admin"
        title="Payment Settings"
        subtitle="Bank QR, account details, and PRO plan configuration."
        compact
      />

      {error && (
        <div className="surface-card card-padded text-sm text-error-600 bg-error-50">
          {error}
        </div>
      )}
      {success && (
        <div className="surface-card card-padded text-sm text-brand-950 bg-brand-50">
          {success}
        </div>
      )}

      <section className="surface-card card-padded space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Bank Payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Current QR code shown on the Payment page.
            </p>
            <div
              className="rounded-2xl p-3 inline-block"
              style={{ background: "#E91E63", maxWidth: 240 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings?.qr_code_url || "/IMG_3906.PNG"}
                alt="Bank QR"
                className="w-full h-auto rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="btn-secondary inline-flex gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading…" : "Upload / Replace QR"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadQr(f);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={save} className="surface-card card-padded space-y-5">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Bank Account & Plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Bank Name"
            value={form.bank_name}
            onChange={(v) => setForm((f) => ({ ...f, bank_name: v }))}
          />
          <Field
            label="Account Name"
            value={form.bank_account_name}
            onChange={(v) => setForm((f) => ({ ...f, bank_account_name: v }))}
          />
          <Field
            label="Account Number"
            value={form.bank_account_number}
            onChange={(v) => setForm((f) => ({ ...f, bank_account_number: v }))}
          />
          <Field
            label="Invoice Issuer Name"
            value={form.invoice_issuer_name}
            onChange={(v) => setForm((f) => ({ ...f, invoice_issuer_name: v }))}
          />
          <Field
            label="PRO Plan Name"
            value={form.plan_name}
            onChange={(v) => setForm((f) => ({ ...f, plan_name: v }))}
            required
          />
          <Field
            label="PRO Plan Price (RM)"
            value={form.plan_price}
            onChange={(v) => setForm((f) => ({ ...f, plan_price: v }))}
            type="number"
            required
          />
          <Field
            label="Subscription Duration (days)"
            value={form.subscription_duration_days}
            onChange={(v) =>
              setForm((f) => ({ ...f, subscription_duration_days: v }))
            }
            type="number"
            required
          />
        </div>

        <button type="submit" className="btn-primary-solid" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
        {label}
      </label>
      <input
        className="input-field w-full"
        type={type}
        value={value}
        required={required}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? 1 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
