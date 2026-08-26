import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  activateProSubscription,
  allocateInvoiceNumber,
  getLatestSubscription,
  getPaymentSettings,
  hasPendingPayment,
  buildDisplayStatus,
} from "@/lib/payment/service";
import {
  canSubmitPaymentWithDays,
  daysUntil,
} from "@/lib/payment/subscription";

/** Confirm payment and immediately activate PRO + generate invoice */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { user, db } = ctx;
    const body = await request.json().catch(() => ({}));
    const nameOverride = String(body.fullName ?? "").trim();
    const phoneOverride = String(body.phone ?? "").trim();

    if (!nameOverride) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const [settings, pending, subscription, profileRes] = await Promise.all([
      getPaymentSettings(db),
      hasPendingPayment(db, user.id),
      getLatestSubscription(db, user.id),
      db
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single(),
    ]);

    const displayStatus = buildDisplayStatus(subscription, pending);
    const daysRemaining = daysUntil(subscription?.expiry_date ?? null);
    const gate = canSubmitPaymentWithDays({
      displayStatus,
      hasPendingPayment: pending,
      daysRemaining,
    });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 409 });
    }

    const profile = profileRes.data;
    const customerName = nameOverride;
    const customerEmail = profile?.email?.trim() || user.email || "";
    const customerPhone = phoneOverride || profile?.phone?.trim() || "";

    if (phoneOverride && phoneOverride !== (profile?.phone ?? "")) {
      await db.from("profiles").update({ phone: phoneOverride }).eq("id", user.id);
    }

    const { subscription: activeSub, startDate, expiryDate } =
      await activateProSubscription({
        db,
        userId: user.id,
        planName: settings.plan_name,
        price: settings.plan_price,
        durationDays: settings.subscription_duration_days,
        existingSubscriptionId: subscription?.id ?? null,
      });

    const invoiceNumber = await allocateInvoiceNumber(db);
    const now = new Date().toISOString();

    const { data: payment, error: payErr } = await db
      .from("payments")
      .insert({
        user_id: user.id,
        subscription_id: activeSub.id,
        invoice_number: invoiceNumber,
        amount: settings.plan_price,
        plan_name: settings.plan_name,
        payment_method: "bank_qr",
        receipt_path: null,
        payment_status: "paid",
        payment_date: now,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        subscription_start_date: startDate,
        subscription_expiry_date: expiryDate,
        approved_at: now,
        approved_by: user.id,
      })
      .select("*")
      .single();

    if (payErr) throw payErr;

    const { data: invoice, error: invErr } = await db
      .from("invoices")
      .insert({
        user_id: user.id,
        payment_id: payment.id,
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        plan_name: settings.plan_name,
        amount: settings.plan_price,
        invoice_date: now.slice(0, 10),
        subscription_start_date: startDate,
        subscription_expiry_date: expiryDate,
        payment_method: "Bank QR Transfer",
        payment_status: "Paid",
      })
      .select("*")
      .single();

    if (invErr) throw invErr;

    return NextResponse.json({
      ok: true,
      message: "Payment confirmed. Your invoice has been generated.",
      payment: { ...payment, amount: Number(payment.amount) },
      invoice: { ...invoice, amount: Number(invoice.amount) },
      subscription: activeSub,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to confirm payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
