"use client";

import Link from "next/link";
import { BRAND_FULL } from "@/lib/brand";
import { getSalesContactUrl } from "@/lib/marketing/contact";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function MarketingFooter() {
  const { copy } = useMarketingLocale();
  const year = new Date().getFullYear();
  const contactUrl = getSalesContactUrl();

  return (
    <footer className="border-t" style={{ borderColor: "var(--border-color)", background: "var(--surface-card)" }}>
      <div className="m-container py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand column */}
          <div className="max-w-xs">
            <BrandLogo size="md" />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {copy.footer.tagline}
            </p>
          </div>

          {/* Product links */}
          <nav aria-label={copy.footer.productTitle}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-4" style={{ color: "var(--text-primary)" }}>
              {copy.footer.productTitle}
            </p>
            <ul className="space-y-2.5">
              {copy.footer.productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] font-semibold transition hover:text-[#2e6b1c] dark:hover:text-[#9fe870]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company links */}
          <nav aria-label={copy.footer.companyTitle}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] mb-4" style={{ color: "var(--text-primary)" }}>
              {copy.footer.companyTitle}
            </p>
            <ul className="space-y-2.5">
              {copy.footer.companyLinks.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={contactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] font-semibold transition hover:text-[#2e6b1c] dark:hover:text-[#9fe870]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[15px] font-semibold transition hover:text-[#2e6b1c] dark:hover:text-[#9fe870]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "var(--border-color)" }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {BRAND_FULL}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {year} {copy.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
