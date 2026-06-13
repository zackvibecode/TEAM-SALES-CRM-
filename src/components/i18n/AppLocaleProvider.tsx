"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAppCopy, type AppCopy } from "@/lib/i18n/get-copy";
import {
  LOCALE_STORAGE_KEY,
  localeFromNavigatorLanguage,
  localeToHtmlLang,
  type Locale,
} from "@/lib/i18n/locale";

interface AppLocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: AppCopy;
}

const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const fromStorage = stored === "bm" || stored === "en" ? (stored as Locale) : null;
    const initial =
      fromStorage ?? localeFromNavigatorLanguage(navigator.language);
    setLocaleState(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getAppCopy(locale),
    }),
    [locale, setLocale]
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center app-shell">
        <div className="w-10 h-10 rounded-full border-2 border-[#3b66ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>
  );
}

export function useAppLocale() {
  const ctx = useContext(AppLocaleContext);
  if (!ctx) {
    throw new Error("useAppLocale must be used within AppLocaleProvider");
  }
  return ctx;
}
