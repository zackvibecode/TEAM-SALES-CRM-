import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;
    const { db } = authResult;

    const { data, error } = await db
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const paymentIds = (data ?? []).map((p) => p.id);
    let invoiceByPayment = new Map<string, { id: string; invoice_number: string }>();
    if (paymentIds.length > 0) {
      const { data: invoices } = await db
        .from("invoices")
        .select("id, invoice_number, payment_id")
        .in("payment_id", paymentIds);
      invoiceByPayment = new Map(
        (invoices ?? []).map((inv) => [
          inv.payment_id as string,
          { id: inv.id, invoice_number: inv.invoice_number },
        ])
      );
    }

    const payments = (data ?? []).map((p) => {
      const inv = invoiceByPayment.get(p.id);
      return {
        ...p,
        amount: Number(p.amount),
        invoice_id: inv?.id ?? null,
        invoice_number: p.invoice_number || inv?.invoice_number || null,
      };
    });

    return NextResponse.json({ payments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list payments";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
