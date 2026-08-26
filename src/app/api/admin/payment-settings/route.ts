import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getPaymentSettings } from "@/lib/payment/service";

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { db } = authResult;
    const settings = await getPaymentSettings(db);
    return NextResponse.json({ settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { user, db } = authResult;

    const body = await request.json();
    const settings = await getPaymentSettings(db);

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (typeof body.plan_name === "string" && body.plan_name.trim()) {
      patch.plan_name = body.plan_name.trim();
    }
    if (body.plan_price !== undefined) {
      const price = Number(body.plan_price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: "Invalid plan price" }, { status: 400 });
      }
      patch.plan_price = price;
    }
    if (body.subscription_duration_days !== undefined) {
      const days = Number(body.subscription_duration_days);
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return NextResponse.json(
          { error: "Duration must be 1–3650 days" },
          { status: 400 }
        );
      }
      patch.subscription_duration_days = days;
    }
    if (typeof body.bank_name === "string") patch.bank_name = body.bank_name.trim();
    if (typeof body.bank_account_name === "string") {
      patch.bank_account_name = body.bank_account_name.trim();
    }
    if (typeof body.bank_account_number === "string") {
      patch.bank_account_number = body.bank_account_number.trim();
    }
    if (typeof body.qr_code_url === "string") {
      patch.qr_code_url = body.qr_code_url.trim() || null;
    }
    if (typeof body.invoice_issuer_name === "string" && body.invoice_issuer_name.trim()) {
      patch.invoice_issuer_name = body.invoice_issuer_name.trim();
    }

    let data;
    if (settings.id) {
      const res = await db
        .from("payment_settings")
        .update(patch)
        .eq("id", settings.id)
        .select("*")
        .single();
      if (res.error) throw res.error;
      data = res.data;
    } else {
      const res = await db
        .from("payment_settings")
        .insert({
          plan_name: "PRO",
          plan_price: 150,
          subscription_duration_days: 30,
          qr_code_url: "/IMG_3906.PNG",
          ...patch,
        })
        .select("*")
        .single();
      if (res.error) throw res.error;
      data = res.data;
    }

    return NextResponse.json({
      settings: { ...data, plan_price: Number(data.plan_price) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
