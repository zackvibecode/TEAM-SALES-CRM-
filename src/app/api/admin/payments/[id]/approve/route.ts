import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  activateProSubscription,
  allocateInvoiceNumber,
  getPaymentSettings,
} from "@/lib/payment/service";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { user, db } = authResult;
    const { id } = await context.params;

    const { data: payment, error: payErr } = await db
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (payErr || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.payment_status === "paid") {
      return NextResponse.json({ error: "Payment already approved" }, { status: 409 });
    }

    if (payment.payment_status !== "pending" && payment.payment_status !== "rejected") {
      return NextResponse.json(
        { error: "Only pending or rejected payments can be approved" },
        { status: 400 }
      );
    }

    const settings = await getPaymentSettings(db);
    const { subscription, startDate, expiryDate } = await activateProSubscription({
      db,
      userId: payment.user_id,
      planName: payment.plan_name || settings.plan_name,
      price: Number(payment.amount) || settings.plan_price,
      durationDays: settings.subscription_duration_days,
      existingSubscriptionId: payment.subscription_id,
    });

    const invoiceNumber = await allocateInvoiceNumber(db);
    const now = new Date().toISOString();

    const { data: updatedPayment, error: updErr } = await db
      .from("payments")
      .update({
        payment_status: "paid",
        invoice_number: invoiceNumber,
        subscription_id: subscription.id,
        subscription_start_date: startDate,
        subscription_expiry_date: expiryDate,
        approved_at: now,
        approved_by: user.id,
        rejection_reason: null,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updErr) throw updErr;

    const { data: invoice, error: invErr } = await db
      .from("invoices")
      .insert({
        user_id: payment.user_id,
        payment_id: payment.id,
        invoice_number: invoiceNumber,
        customer_name: payment.customer_name,
        customer_phone: payment.customer_phone,
        customer_email: payment.customer_email,
        plan_name: payment.plan_name || settings.plan_name,
        amount: payment.amount,
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
      payment: { ...updatedPayment, amount: Number(updatedPayment.amount) },
      invoice: { ...invoice, amount: Number(invoice.amount) },
      subscription,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
