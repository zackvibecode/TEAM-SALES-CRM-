"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useTheme } from "@/components/layout/ThemeProvider";
import { LangToggle } from "./LangToggle";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function MarketingNav() {
  const pathname = usePathname();
  const { copy } = useMarketingLocale();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/#features", label: copy.footer.productLinks[0]?.label ?? "Features" },
    { href: "/pricing", label: copy.nav.pricing },
    { href: "/#faq", label: copy.footer.productLinks[2]?.label ?? "FAQ" },
  ];

  const linkClass = (href: string) =>
    `m-nav-link ${pathname === href ? "m-nav-link-active" : ""}`;

  return (
    <header
      className={`m-nav sticky top-0 z-50 backdrop-blur-md ${scrolled || menuOpen ? "m-nav-scrolled" : ""}`}
      style={{
        background: menuOpen
          ? "var(--surface-card)"
          : "color-mix(in srgb, var(--surface-bg) 78%, transparent)",
      }}
    >
      <div className="m-container h-16 sm:h-[72px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center min-w-0 shrink-0" aria-label="Zaqone CRM home">
          <BrandLogo size="md" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LangToggle />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-full border transition hover:bg-[var(--surface-muted)]"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/login"
            className="btn-primary-solid !min-h-0 !py-2.5 !px-5 !text-sm hidden md:inline-flex"
          >
            {copy.nav.login}
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border transition"
            style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`m-mobile-menu md:hidden ${menuOpen ? "m-mobile-menu-open" : ""}`}
        style={{ background: "var(--surface-card)" }}
      >
        <nav className="m-container pb-6 pt-1 flex flex-col gap-1" aria-label="Mobile">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold transition hover:bg-[var(--surface-muted)]"
              style={{ color: "var(--text-primary)" }}
            >
              {link.label}
              <ArrowRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
          <div className="mt-3 flex items-center gap-3">
            <LangToggle />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border transition"
              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
              aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="btn-primary-solid mt-3 w-full"
          >
            {copy.nav.login}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
