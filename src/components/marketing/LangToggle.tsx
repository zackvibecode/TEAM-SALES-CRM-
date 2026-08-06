"use client";

import { useMarketingLocale } from "./MarketingLocaleProvider";
import type { Locale } from "@/lib/marketing/locale";

export function LangToggle() {
  const { locale, setLocale } = useMarketingLocale();

  const btn = (value: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(value)}
      className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
        locale === value
          ? "bg-[#9fe870] text-[#163300]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
      aria-pressed={locale === value}
    >
      {label}
    </button>
  );

  return (
    <div
      className="inline-flex items-center gap-0.5 p-1 rounded-full border"
      style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
      role="group"
      aria-label="Language"
    >
      {btn("bm", "BM")}
      {btn("en", "EN")}
    </div>
  );
}
