import { BRAND_WHATSAPP_INTRO } from "@/lib/brand";

export interface WhatsAppTemplate {
  id: string;
  label: string;
  message: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "followup",
    label: "First follow-up",
    message: BRAND_WHATSAPP_INTRO.replace("Tuan/Puan", "{name}"),
  },
  {
    id: "package",
    label: "Share package info",
    message:
      "Hi {name}, terima kasih atas minat anda. Saya boleh kongsi pakej dan harga terkini — bila sesuai untuk saya call atau WhatsApp anda?",
  },
  {
    id: "reminder",
    label: "Gentle reminder",
    message:
      "Hi {name}, saya follow up sekali lagi dari Zaqone CRM. Jika masih berminat, reply OK dan saya hantar detail pakej.",
  },
];

export function applyTemplate(template: string, customerName: string): string {
  const name = customerName?.trim() || "Tuan/Puan";
  return template.replace(/\{name\}/gi, name);
}

export function resolveWhatsAppMessage(
  savedPretext: string | null | undefined,
  customerName?: string
): string {
  const template = savedPretext?.trim();
  if (!template) return "";
  return applyTemplate(template, customerName ?? "");
}
