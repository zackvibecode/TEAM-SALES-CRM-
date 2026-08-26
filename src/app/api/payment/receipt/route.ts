import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

/** Signed URL for viewing own (or admin) payment receipt */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const paymentId = request.nextUrl.searchParams.get("paymentId");
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId required" }, { status: 400 });
    }

    const { data: payment, error } = await ctx.db
      .from("payments")
      .select("id, user_id, receipt_path")
      .eq("id", paymentId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.user_id !== ctx.user.id && ctx.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!payment.receipt_path) {
      return NextResponse.json({ error: "No receipt uploaded" }, { status: 404 });
    }

    const { data: signed, error: signErr } = await ctx.db.storage
      .from("payment-receipts")
      .createSignedUrl(payment.receipt_path, 60 * 10);

    if (signErr || !signed?.signedUrl) throw signErr || new Error("Signed URL failed");

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load receipt";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
