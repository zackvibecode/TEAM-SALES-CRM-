import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLatestSubscription,
  getPaymentSettings,
  hasPendingPayment,
  buildDisplayStatus,
} from "@/lib/payment/service";
import {
  canSubmitPaymentWithDays,
  daysUntil,
} from "@/lib/payment/subscription";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

/** Submit payment with receipt upload (multipart) */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { user, db } = ctx;
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;
    const nameOverride = String(formData.get("fullName") ?? "").trim();
    const phoneOverride = String(formData.get("phone") ?? "").trim();

    if (!file) {
      return NextResponse.json({ error: "Payment receipt is required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, or PDF allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Max file size is 5MB" }, { status: 400 });
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
    if (!nameOverride) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    const customerName = nameOverride;
    const customerEmail = profile?.email?.trim() || user.email || "";
    const customerPhone = phoneOverride || profile?.phone?.trim() || "";

    if (phoneOverride && phoneOverride !== (profile?.phone ?? "")) {
      await db.from("profiles").update({ phone: phoneOverride }).eq("id", user.id);
    }

    const ext =
      file.type === "application/pdf"
        ? "pdf"
        : file.name.split(".").pop()?.toLowerCase() || "jpg";
    const receiptPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("payment-receipts")
      .upload(receiptPath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    let subscriptionId = subscription?.id ?? null;

    if (subscriptionId) {
      await db
        .from("subscriptions")
        .update({
          status: "payment_pending",
          plan_name: settings.plan_name,
          price: settings.plan_price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);
    } else {
      const { data: created, error: subErr } = await db
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_name: settings.plan_name,
          price: settings.plan_price,
          status: "payment_pending",
        })
        .select("id")
        .single();
      if (subErr) throw subErr;
      subscriptionId = created.id;
    }

    const { data: payment, error: payErr } = await db
      .from("payments")
      .insert({
        user_id: user.id,
        subscription_id: subscriptionId,
        amount: settings.plan_price,
        plan_name: settings.plan_name,
        payment_method: "bank_qr",
        receipt_path: receiptPath,
        payment_status: "pending",
        payment_date: new Date().toISOString(),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
      })
      .select("*")
      .single();

    if (payErr) {
      // Clean up receipt if payment insert fails
      await db.storage.from("payment-receipts").remove([receiptPath]);
      throw payErr;
    }

    return NextResponse.json({
      ok: true,
      message:
        "Payment submitted successfully. Your payment is currently pending verification.",
      payment: { ...payment, amount: Number(payment.amount) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit payment";
    // Unique pending constraint
    if (typeof msg === "string" && msg.includes("idx_payments_one_pending")) {
      return NextResponse.json(
        { error: "You already have a payment pending verification." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
