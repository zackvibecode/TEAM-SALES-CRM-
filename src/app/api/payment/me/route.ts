import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLatestSubscription,
  getPaymentSettings,
  hasPendingPayment,
  syncSubscriptionDerivedStatus,
  buildDisplayStatus,
} from "@/lib/payment/service";
import { daysUntil, getSubscriptionReminder } from "@/lib/payment/subscription";

export async function GET() {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { user, db } = ctx;

    const [{ data: profile }, settings, pending, rawSub] = await Promise.all([
      db
        .from("profiles")
        .select("id, email, full_name, phone, role")
        .eq("id", user.id)
        .single(),
      getPaymentSettings(db),
      hasPendingPayment(db, user.id),
      getLatestSubscription(db, user.id),
    ]);

    const subscription = await syncSubscriptionDerivedStatus(db, rawSub);
    const displayStatus = buildDisplayStatus(subscription, pending);
    const daysRemaining = daysUntil(subscription?.expiry_date ?? null);
    const reminder = getSubscriptionReminder(
      subscription
        ? { ...subscription, status: displayStatus }
        : null
    );

    const { data: payments, error: payErr } = await db
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (payErr) throw payErr;

    const paymentIds = (payments ?? []).map((p) => p.id);
    let invoiceByPayment = new Map<string, Record<string, unknown>>();
    if (paymentIds.length > 0) {
      const { data: invoices } = await db
        .from("invoices")
        .select("*")
        .in("payment_id", paymentIds);
      invoiceByPayment = new Map(
        (invoices ?? []).map((inv) => [inv.payment_id as string, inv])
      );
    }

    const mapped = (payments ?? []).map((p) => {
      const inv = invoiceByPayment.get(p.id);
      return {
        ...p,
        amount: Number(p.amount),
        invoice: inv
          ? { ...inv, amount: Number(inv.amount) }
          : null,
      };
    });

    return NextResponse.json({
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            phone: profile.phone ?? "",
            role: profile.role,
          }
        : {
            id: user.id,
            email: user.email ?? "",
            full_name: "",
            phone: "",
            role: ctx.role,
          },
      settings: {
        plan_name: settings.plan_name,
        plan_price: settings.plan_price,
        subscription_duration_days: settings.subscription_duration_days,
        bank_name: settings.bank_name,
        bank_account_name: settings.bank_account_name,
        bank_account_number: settings.bank_account_number,
        qr_code_url: settings.qr_code_url || "/IMG_3906.PNG",
      },
      subscription,
      displayStatus,
      daysRemaining,
      hasPendingPayment: pending,
      reminder,
      payments: mapped,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load payment data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
