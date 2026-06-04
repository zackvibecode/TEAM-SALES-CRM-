export function getSalesContactUrl(): string {
  const url = process.env.NEXT_PUBLIC_SALES_CONTACT_URL?.trim();
  if (url) return url;
  return "mailto:sales@zaqone.com?subject=Zaqone%20CRM%20Inquiry";
}
