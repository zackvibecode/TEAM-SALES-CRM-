"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { BRAND_NAME, BRAND_BYLINE } from "@/lib/brand";
import { useTheme } from "@/components/layout/ThemeProvider";
import { LangToggle } from "./LangToggle";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function MarketingNav() {
  const pathname = usePathname();
  const { copy } = useMarketingLocale();
  const { theme, toggleTheme } = useTheme();

  const linkClass = (href: string) =>
    `text-sm font-semibold transition ${
      pathname === href
        ? "text-[#3b66ff]"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        borderColor: "var(--border-color)",
        background: "color-mix(in srgb, var(--surface-card) 85%, transparent)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#3b66ff] flex items-center justify-center shrink-0 shadow-md">
            <span className="text-lg font-extrabold text-white">Z</span>
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {BRAND_NAME}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {BRAND_BYLINE}
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/pricing" className={linkClass("/pricing")}>
            {copy.nav.pricing}
          </Link>
          <LangToggle />
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-secondary p-2.5"
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link href="/login" className="btn-primary-solid text-sm px-4 py-2 hidden sm:inline-flex">
            {copy.nav.login}
          </Link>
        </nav>
      </div>
    </header>
  );
}
