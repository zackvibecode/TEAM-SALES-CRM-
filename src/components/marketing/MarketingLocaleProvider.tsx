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
import { useSearchParams } from "next/navigation";
import { getCopy, type MarketingCopy } from "@/lib/marketing/copy";
import {
  LOCALE_STORAGE_KEY,
  localeFromNavigatorLanguage,
  parseLocaleParam,
  type Locale,
} from "@/lib/marketing/locale";

interface MarketingLocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  copy: MarketingCopy;
}

const MarketingLocaleContext = createContext<MarketingLocaleContextValue | null>(null);

export function MarketingLocaleProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl = parseLocaleParam(searchParams.get("lang"));
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const fromStorage =
      stored === "bm" || stored === "en" ? (stored as Locale) : null;
    const initial =
      fromUrl ??
      fromStorage ??
      localeFromNavigatorLanguage(navigator.language);
    setLocaleState(initial);
    setReady(true);
  }, [searchParams]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: getCopy(locale),
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
    <MarketingLocaleContext.Provider value={value}>
      {children}
    </MarketingLocaleContext.Provider>
  );
}

export function useMarketingLocale() {
  const ctx = useContext(MarketingLocaleContext);
  if (!ctx) {
    throw new Error("useMarketingLocale must be used within MarketingLocaleProvider");
  }
  return ctx;
}
