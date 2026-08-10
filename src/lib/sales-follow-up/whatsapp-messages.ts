import { applyTemplate } from "@/lib/whatsapp-templates";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { WHATSAPP_PRETEXT_MAX_LENGTH } from "@/lib/whatsapp-pretext";

export type SfuWaTemplateKey = "1" | "2" | "3";
export type SfuWaTemplates = Partial<Record<SfuWaTemplateKey, string>>;

/** Default WhatsApp copy by follow-up round (1 / 2 / 3+). */
export const SFU_WA_TEMPLATES: Record<SfuWaTemplateKey, string> = {
  1: "Hi {name}, saya dari Zaqone. Nak follow up minat anda — boleh saya bantu dengan pakej terkini?",
  2: "Hi {name}, follow up kedua dari Zaqone. Ada soalan pasal pakej? Reply OK saya hantar detail.",
  3: "Hi {name}, follow up terakhir dari saya. Kalau masih berminat, reply ya — saya arrange terus. Terima kasih.",
};

export const SFU_WA_TEMPLATE_MAX_LENGTH = WHATSAPP_PRETEXT_MAX_LENGTH;

export function sfuTemplateKeyForRound(followUpNumber: number): SfuWaTemplateKey {
  if (followUpNumber <= 1) return "1";
  if (followUpNumber === 2) return "2";
  return "3";
}

export function normalizeSfuWaTemplates(raw: unknown): SfuWaTemplates {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const out: SfuWaTemplates = {};
  for (const key of ["1", "2", "3"] as const) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim().slice(0, SFU_WA_TEMPLATE_MAX_LENGTH);
    }
  }
  return out;
}

export function salesFollowUpWhatsAppMessage(
  followUpNumber: number,
  customerName: string,
  userTemplates?: SfuWaTemplates | null
): string {
  const key = sfuTemplateKeyForRound(followUpNumber);
  const custom = userTemplates?.[key]?.trim();
  const template = custom || SFU_WA_TEMPLATES[key];
  return applyTemplate(template, customerName);
}

export function salesFollowUpWhatsAppLink(
  phone: string,
  followUpNumber: number,
  customerName: string,
  userTemplates?: SfuWaTemplates | null
): string {
  return getWhatsAppLink(
    phone,
    salesFollowUpWhatsAppMessage(followUpNumber, customerName, userTemplates)
  );
}
