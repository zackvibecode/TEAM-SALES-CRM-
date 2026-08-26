import { jsPDF } from "jspdf";
import type { Invoice } from "@/types/payment";
import { formatDateDisplay, formatPlanPrice } from "./subscription";

const BRAND = "ZAQONE";
const BYLINE = "BY ZAQONE.COM";
const FOOTER = "ZAQONE.COM";
const THANKS = "Thank you for choosing ZAQONE.";

export function buildInvoicePdf(
  invoice: Invoice,
  issuerName: string
): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(14, 15, 12);
  doc.text(BRAND, margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 110, 104);
  doc.text(BYLINE, margin, y);

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(69, 71, 69);
  doc.text(issuerName, margin, y);

  // Right header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(14, 15, 12);
  doc.text("INVOICE", pageW - margin, 24, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(69, 71, 69);
  doc.text(`Invoice Number: ${invoice.invoice_number}`, pageW - margin, 32, {
    align: "right",
  });
  doc.text(`Invoice Date: ${formatDateDisplay(invoice.invoice_date)}`, pageW - margin, 38, {
    align: "right",
  });
  doc.text(`Status: ${invoice.payment_status}`, pageW - margin, 44, {
    align: "right",
  });

  y = 52;
  doc.setDrawColor(232, 230, 223);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 15, 12);
  doc.text("Customer Details", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(69, 71, 69);
  const customerLines = [
    `Name: ${invoice.customer_name || "—"}`,
    `Phone: ${invoice.customer_phone || "—"}`,
    `Email: ${invoice.customer_email || "—"}`,
  ];
  for (const line of customerLines) {
    doc.text(line, margin, y);
    y += 6;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 15, 12);
  doc.text("Subscription Details", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(69, 71, 69);
  const subLines = [
    `Plan: ${invoice.plan_name}`,
    `Amount: ${formatPlanPrice(Number(invoice.amount))}`,
    `Subscription Start Date: ${formatDateDisplay(invoice.subscription_start_date)}`,
    `Subscription Expiry Date: ${formatDateDisplay(invoice.subscription_expiry_date)}`,
  ];
  for (const line of subLines) {
    doc.text(line, margin, y);
    y += 6;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(14, 15, 12);
  doc.text("Payment Details", margin, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(69, 71, 69);
  doc.text(`Payment Method: ${invoice.payment_method}`, margin, y);
  y += 6;
  doc.text(`Payment Status: ${invoice.payment_status}`, margin, y);

  y += 14;
  doc.setFillColor(246, 251, 239);
  doc.roundedRect(margin, y - 8, pageW - margin * 2, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(14, 15, 12);
  doc.text("Total", margin + 6, y + 3);
  const totalLabel = `RM${Number(invoice.amount).toFixed(2)}`;
  doc.text(totalLabel, pageW - margin - 6, y + 3, {
    align: "right",
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 24;
  doc.setDrawColor(232, 230, 223);
  doc.line(margin, footerY - 8, pageW - margin, footerY - 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(14, 15, 12);
  doc.text(FOOTER, pageW / 2, footerY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 110, 104);
  doc.text(THANKS, pageW / 2, footerY + 6, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

export function invoicePdfFilename(invoiceNumber: string): string {
  return `${invoiceNumber}.pdf`;
}
