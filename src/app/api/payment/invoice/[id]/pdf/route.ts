import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPaymentSettings } from "@/lib/payment/service";
import {
  buildInvoicePdf,
  invoicePdfFilename,
} from "@/lib/payment/generate-invoice-pdf";
import type { Invoice } from "@/types/payment";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: invoice, error } = await ctx.db
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.user_id !== ctx.user.id && ctx.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getPaymentSettings(ctx.db);
    const pdf = buildInvoicePdf(
      { ...invoice, amount: Number(invoice.amount) } as Invoice,
      settings.invoice_issuer_name
    );

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoicePdfFilename(invoice.invoice_number)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate invoice";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
