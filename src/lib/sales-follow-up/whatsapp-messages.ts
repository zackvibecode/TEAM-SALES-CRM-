import { applyTemplate } from "@/lib/whatsapp-templates";
import { getWhatsAppLink } from "@/lib/whatsapp";

/** Default WhatsApp copy by follow-up round (1 / 2 / 3+). */
export const SFU_WA_TEMPLATES = {
  1: "Hi {name}, saya dari Zaqone. Nak follow up minat anda — boleh saya bantu dengan pakej terkini?",
  2: "Hi {name}, follow up kedua dari Zaqone. Ada soalan pasal pakej? Reply OK saya hantar detail.",
  3: "Hi {name}, follow up terakhir dari saya. Kalau masih berminat, reply ya — saya arrange terus. Terima kasih.",
} as const;

export function salesFollowUpWhatsAppMessage(
  followUpNumber: number,
  customerName: string
): string {
  const key = followUpNumber <= 1 ? 1 : followUpNumber === 2 ? 2 : 3;
  return applyTemplate(SFU_WA_TEMPLATES[key], customerName);
}

export function salesFollowUpWhatsAppLink(
  phone: string,
  followUpNumber: number,
  customerName: string
): string {
  return getWhatsAppLink(
    phone,
    salesFollowUpWhatsAppMessage(followUpNumber, customerName)
  );
}
