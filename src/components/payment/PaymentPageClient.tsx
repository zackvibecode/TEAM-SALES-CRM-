"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PaymentStatusBadge,
  SubscriptionStatusBadge,
} from "@/components/payment/StatusBadges";
import { SubscriptionReminderBanner } from "@/components/payment/SubscriptionReminderBanner";
import {
  canSubmitPaymentWithDays,
  formatDateDisplay,
  formatPlanPrice,
} from "@/lib/payment/subscription";
import type {
  PaymentWithInvoice,
  Subscription,
  SubscriptionReminder,
  SubscriptionStatus,
} from "@/types/payment";

interface PaymentMeResponse {
  profile: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
  };
  settings: {
    plan_name: string;
    plan_price: number;
    subscription_duration_days: number;
    bank_name: string;
    bank_account_name: string;
    bank_account_number: string;
    qr_code_url: string;
  };
  subscription: Subscription | null;
  displayStatus: SubscriptionStatus;
  daysRemaining: number | null;
  hasPendingPayment: boolean;
  reminder: SubscriptionReminder | null;
  payments: PaymentWithInvoice[];
}

export function PaymentPageClient({ role }: { role: "admin" | "sales" }) {
  const [data, setData] = useState<PaymentMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/me");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
      setPhone(json.profile?.phone || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const gate = data
    ? canSubmitPaymentWithDays({
        displayStatus: data.displayStatus,
        hasPendingPayment: data.hasPendingPayment,
        daysRemaining: data.daysRemaining,
      })
    : { ok: false as const, reason: "Loading…" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || submitting || !gate.ok) return;
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!file) {
      setError("Please upload your payment receipt.");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("receipt", file);
      fd.append("fullName", fullName.trim());
      if (phone.trim()) fd.append("phone", phone.trim());

      const res = await fetch("/api/payment/submit", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submit failed");

      setSuccess(json.message);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
      // brief cooldown against double-click
      setTimeout(() => {
        submitLock.current = false;
      }, 1500);
    }
  }

  async function openReceipt(paymentId: string) {
    try {
      const res = await fetch(`/api/payment/receipt?paymentId=${paymentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open receipt");
    }
  }

  function downloadInvoice(invoiceId: string) {
    window.open(`/api/payment/invoice/${invoiceId}/pdf`, "_blank", "noopener,noreferrer");
  }

  if (loading && !data) {
    return (
      <div className="dashboard-shell flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-shell">
        <p className="text-sm text-error-600">{error || "Unable to load payment page."}</p>
      </div>
    );
  }

  const { settings, subscription, displayStatus, payments, reminder, profile } = data;
  const isProActive = displayStatus === "active" || displayStatus === "expiring_soon";

  return (
    <div className="dashboard-shell space-y-5">
      <PageHeader
        badge="Billing"
        title="Payment"
        subtitle="Manage your PRO subscription, pay via bank QR, and download invoices."
        compact
      />

      {reminder && <SubscriptionReminderBanner reminder={reminder} />}

      {success && (
        <div className="surface-card card-padded flex items-start gap-3 border border-brand-200 bg-brand-50">
          <CheckCircle2 className="w-5 h-5 text-brand-800 shrink-0 mt-0.5" />
          <p className="text-sm text-brand-950">{success}</p>
        </div>
      )}

      {error && (
        <div className="surface-card card-padded text-sm text-error-600 border border-error-50 bg-error-50">
          {error}
        </div>
      )}

      {/* Current subscription */}
      <section className="surface-card card-padded space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Current Subscription
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {isProActive
                ? `Current Plan: ${subscription?.plan_name || settings.plan_name}`
                : "You are not on an active paid plan."}
            </p>
          </div>
          <SubscriptionStatusBadge status={displayStatus} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoTile label="Plan" value={subscription?.plan_name || settings.plan_name} />
          <InfoTile label="Price" value={formatPlanPrice(settings.plan_price)} />
          <InfoTile
            label="Start Date"
            value={formatDateDisplay(subscription?.start_date)}
          />
          <InfoTile
            label="Expiry Date"
            value={formatDateDisplay(subscription?.expiry_date)}
          />
        </div>
      </section>

      {/* PRO plan card */}
      <section
        className="surface-card overflow-hidden border"
        style={{ borderColor: "color-mix(in srgb, #9fe870 45%, var(--border-color))" }}
      >
        <div
          className="px-5 py-4 flex flex-wrap items-end justify-between gap-3"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, #9fe870 22%, transparent), transparent)",
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
              Subscription Plan
            </p>
            <h3 className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
              {settings.plan_name} Plan
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {settings.subscription_duration_days}-day access · Bank QR payment
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-950">
              {formatPlanPrice(settings.plan_price)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              per billing period
            </p>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-wrap gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>Payment status:</span>
          <SubscriptionStatusBadge status={displayStatus} />
          {profile.full_name && (
            <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
              Billed to {profile.full_name}
            </span>
          )}
        </div>
      </section>

      {/* Make payment */}
      <section className="surface-card card-padded space-y-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Make Payment
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Scan the Malaysia National QR, pay the amount below, then upload your receipt.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded-2xl p-4 shadow-sm w-full"
              style={{ background: "#E91E63", maxWidth: 440 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.qr_code_url || "/IMG_3906.PNG"}
                alt="Malaysia National QR — Bank payment"
                className="w-full h-auto rounded-xl bg-white"
              />
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Amount to Pay: {formatPlanPrice(settings.plan_price)}
            </p>
            {(settings.bank_name || settings.bank_account_name || settings.bank_account_number) && (
              <div className="text-center text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
                {settings.bank_name && <p>{settings.bank_name}</p>}
                {settings.bank_account_name && <p>{settings.bank_account_name}</p>}
                {settings.bank_account_number && <p>{settings.bank_account_number}</p>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>Scan the QR code.</li>
              <li>Make payment of {formatPlanPrice(settings.plan_price)}.</li>
              <li>Upload your payment receipt.</li>
              <li>Submit payment for verification.</li>
            </ol>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Full Name
                </label>
                <input
                  className="input-field w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  disabled={!gate.ok || submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Email
                </label>
                <input
                  className="input-field w-full"
                  value={profile.email || ""}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Phone Number
                </label>
                <input
                  className="input-field w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01X-XXXXXXX"
                  disabled={!gate.ok || submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Upload Payment Receipt
                </label>
                <div
                  className="rounded-xl border border-dashed p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  style={{ borderColor: "var(--input-border)", background: "var(--surface-muted)" }}
                >
                  <Upload className="w-5 h-5 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {file ? file.name : "JPG, JPEG, PNG, or PDF · max 5MB"}
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      className="mt-2 text-sm w-full"
                      disabled={!gate.ok || submitting}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>

              {!gate.ok && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {gate.reason}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary-solid w-full sm:w-auto"
                disabled={!gate.ok || submitting || !file}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Payment"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Payment history */}
      <section className="surface-card card-padded space-y-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Payment History
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Invoices and receipts for your account.
          </p>
        </div>

        {payments.length === 0 ? (
          <div
            className="rounded-xl px-4 py-10 text-center text-sm"
            style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
          >
            No payments yet.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <th className="pb-3 pr-3 font-semibold">Invoice</th>
                    <th className="pb-3 pr-3 font-semibold">Plan</th>
                    <th className="pb-3 pr-3 font-semibold">Amount</th>
                    <th className="pb-3 pr-3 font-semibold">Date</th>
                    <th className="pb-3 pr-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <td className="py-3 pr-3 font-medium" style={{ color: "var(--text-primary)" }}>
                        {p.invoice_number || "—"}
                      </td>
                      <td className="py-3 pr-3">{p.plan_name}</td>
                      <td className="py-3 pr-3">{formatPlanPrice(Number(p.amount))}</td>
                      <td className="py-3 pr-3">{formatDateDisplay(p.payment_date)}</td>
                      <td className="py-3 pr-3">
                        <PaymentStatusBadge
                          status={
                            p.payment_status === "rejected" ? "rejected" : p.payment_status
                          }
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {p.invoice?.id && (
                            <>
                              <button
                                type="button"
                                className="btn-secondary text-xs gap-1"
                                onClick={() => downloadInvoice(p.invoice!.id)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Invoice
                              </button>
                              <button
                                type="button"
                                className="btn-secondary text-xs gap-1"
                                onClick={() => downloadInvoice(p.invoice!.id)}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                            </>
                          )}
                          {p.receipt_path && (
                            <button
                              type="button"
                              className="btn-secondary text-xs gap-1"
                              onClick={() => openReceipt(p.id)}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Receipt
                            </button>
                          )}
                          {p.payment_status === "rejected" && p.rejection_reason && (
                            <span className="text-xs text-error-600 self-center">
                              {p.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border p-4 space-y-2"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">
                      {p.invoice_number || "No invoice yet"}
                    </span>
                    <PaymentStatusBadge status={p.payment_status} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {p.plan_name} · {formatPlanPrice(Number(p.amount))} ·{" "}
                    {formatDateDisplay(p.payment_date)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.invoice?.id && (
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => downloadInvoice(p.invoice!.id)}
                      >
                        Download Invoice
                      </button>
                    )}
                    {p.receipt_path && (
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        onClick={() => openReceipt(p.id)}
                      >
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {role === "admin" && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Admin tip: manage verifications under Admin → Payments, and QR/plan under Payment Settings.
        </p>
      )}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{ background: "var(--surface-muted)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
