"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
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
        <Link href="/" className="flex items-center min-w-0 shrink-0">
          <BrandLogo size="md" priority />
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
