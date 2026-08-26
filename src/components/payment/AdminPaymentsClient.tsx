"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaymentStatusBadge } from "@/components/payment/StatusBadges";
import { formatDateDisplay, formatPlanPrice } from "@/lib/payment/subscription";
import type { PaymentStatus } from "@/types/payment";

interface AdminPaymentRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  plan_name: string;
  amount: number;
  payment_date: string;
  payment_status: PaymentStatus;
  invoice_number: string | null;
  invoice_id: string | null;
  receipt_path: string | null;
  rejection_reason: string | null;
}

export function AdminPaymentsClient() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setPayments(json.payments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approve failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reject failed");
      setRejectId(null);
      setRejectReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  async function openReceipt(paymentId: string) {
    const res = await fetch(`/api/payment/receipt?paymentId=${paymentId}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Could not open receipt");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="dashboard-shell space-y-5">
      <PageHeader
        badge="Admin"
        title="Payments"
        subtitle="Review receipts, approve PRO activations, and generate invoices."
        compact
      />

      {error && (
        <div className="surface-card card-padded text-sm text-error-600 bg-error-50">
          {error}
        </div>
      )}

      <section className="surface-card card-padded">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--text-muted)" }}>
            No payment submissions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  <th className="pb-3 pr-3 font-semibold">Customer</th>
                  <th className="pb-3 pr-3 font-semibold">Phone</th>
                  <th className="pb-3 pr-3 font-semibold">Email</th>
                  <th className="pb-3 pr-3 font-semibold">Plan</th>
                  <th className="pb-3 pr-3 font-semibold">Amount</th>
                  <th className="pb-3 pr-3 font-semibold">Date</th>
                  <th className="pb-3 pr-3 font-semibold">Status</th>
                  <th className="pb-3 pr-3 font-semibold">Invoice</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t align-top"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <td className="py-3 pr-3 font-medium">{p.customer_name || "—"}</td>
                    <td className="py-3 pr-3">{p.customer_phone || "—"}</td>
                    <td className="py-3 pr-3 break-all">{p.customer_email || "—"}</td>
                    <td className="py-3 pr-3">{p.plan_name}</td>
                    <td className="py-3 pr-3">{formatPlanPrice(p.amount)}</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {formatDateDisplay(p.payment_date)}
                    </td>
                    <td className="py-3 pr-3">
                      <PaymentStatusBadge status={p.payment_status} />
                    </td>
                    <td className="py-3 pr-3">{p.invoice_number || "—"}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {p.receipt_path && (
                          <button
                            type="button"
                            className="btn-secondary text-xs"
                            onClick={() => openReceipt(p.id)}
                          >
                            View Receipt
                          </button>
                        )}
                        {p.payment_status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="btn-primary-solid text-xs gap-1"
                              disabled={busyId === p.id}
                              onClick={() => approve(p.id)}
                            >
                              {busyId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn-secondary text-xs gap-1"
                              disabled={busyId === p.id}
                              onClick={() => {
                                setRejectId(p.id);
                                setRejectReason("");
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {p.invoice_id && (
                          <a
                            className="btn-secondary text-xs"
                            href={`/api/payment/invoice/${p.invoice_id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Invoice PDF
                          </a>
                        )}
                      </div>
                      {rejectId === p.id && (
                        <div className="mt-3 space-y-2 max-w-xs">
                          <textarea
                            className="input-field w-full text-sm min-h-[72px]"
                            placeholder="Rejection reason (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn-primary-solid text-xs"
                              disabled={busyId === p.id}
                              onClick={() => reject(p.id)}
                            >
                              Confirm Reject
                            </button>
                            <button
                              type="button"
                              className="btn-secondary text-xs"
                              onClick={() => setRejectId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
