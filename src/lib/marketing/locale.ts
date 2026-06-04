export type Locale = "bm" | "en";

export const LOCALE_STORAGE_KEY = "zaqone-locale";

export function localeFromNavigatorLanguage(lang: string): Locale {
  const lower = lang.toLowerCase();
  if (lower.startsWith("ms") || lower === "bm") return "bm";
  return "en";
}

export function parseLocaleParam(param: string | null | undefined): Locale | null {
  if (param === "bm" || param === "en") return param;
  return null;
}

export function isLocale(value: string): value is Locale {
  return value === "bm" || value === "en";
}
