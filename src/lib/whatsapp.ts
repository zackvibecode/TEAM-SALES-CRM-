import { LeadStatus } from "@/types";

export function formatWhatsAppNumber(number: string): string {
  let cleaned = number.replace(/[\s\-\(\)\+]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "60" + cleaned.slice(1);
  }

  // If it's a Malaysia number without country code (starts with 1-9), add 60
  if (/^[1-9]/.test(cleaned) && cleaned.length <= 10) {
    cleaned = "60" + cleaned;
  }

  return cleaned;
}

export function getWhatsAppLink(number: string, message?: string): string {
  const formatted = formatWhatsAppNumber(number);
  const text = message?.trim();
  if (!text) return `https://wa.me/${formatted}`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

export function normalizeStatus(status: string): LeadStatus {
  const normalized = status.trim().toLowerCase();
  const statusMap: Record<string, LeadStatus> = {
    pending: "Pending",
    clicked: "Clicked",
    "follow up": "Follow Up",
    follow_up: "Follow Up",
    followup: "Follow Up",
    interested: "Interested",
    "not interested": "Not Interested",
    not_interested: "Not Interested",
    notinterested: "Not Interested",
    "no response": "No Response",
    no_response: "No Response",
    noresponse: "No Response",
    converted: "Converted",
  };
  return statusMap[normalized] || "Pending";
}

export function isDuplicateWhatsapp(
  whatsapp: string,
  existingNumbers: Set<string>
): boolean {
  const formatted = formatWhatsAppNumber(whatsapp);
  return existingNumbers.has(formatted);
}