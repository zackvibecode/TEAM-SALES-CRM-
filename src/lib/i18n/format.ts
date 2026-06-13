import type { Locale } from "./locale";
import { localeToDateLocale } from "./locale";

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(localeToDateLocale(locale));
}

export function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(localeToDateLocale(locale));
}
