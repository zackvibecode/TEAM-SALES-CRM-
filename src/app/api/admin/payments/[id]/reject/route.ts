import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { db } = authResult;
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

    const { data: payment, error: payErr } = await db
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (payErr || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.payment_status !== "pending") {
      return NextResponse.json(
        { error: "Only pending payments can be rejected" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await db
      .from("payments")
      .update({
        payment_status: "rejected",
        rejection_reason: reason || null,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updErr) throw updErr;

    if (payment.subscription_id) {
      await db
        .from("subscriptions")
        .update({
          status: "unpaid",
          updated_at: now,
        })
        .eq("id", payment.subscription_id)
        .eq("status", "payment_pending");
    }

    return NextResponse.json({
      ok: true,
      payment: { ...updated, amount: Number(updated.amount) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reject payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
