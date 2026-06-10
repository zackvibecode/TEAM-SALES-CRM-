/** Build WhatsApp deep link with encoded pre-filled message */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/** Normalize phone to international format without plus symbol */
export function normalizeRotatorPhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

/** Generate URL-safe slug from page name */
export function slugifyRotatorName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
