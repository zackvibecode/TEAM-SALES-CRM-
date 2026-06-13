"use client";

import { useAppLocale } from "./AppLocaleProvider";
import type { Locale } from "@/lib/i18n/locale";

export function AppLangToggle() {
  const { locale, setLocale, t } = useAppLocale();

  const btn = (value: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(value)}
      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
        locale === value
          ? "bg-[#3b66ff] text-white"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
      aria-pressed={locale === value}
    >
      {label}
    </button>
  );

  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-xl border"
      style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
      role="group"
      aria-label={t.common.language}
    >
      {btn("bm", "BM")}
      {btn("en", "EN")}
    </div>
  );
}
