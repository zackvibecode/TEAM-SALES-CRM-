"use client";

import Link from "next/link";
import { BRAND_FULL } from "@/lib/brand";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function MarketingFooter() {
  const { copy } = useMarketingLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t mt-16" style={{ borderColor: "var(--border-color)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            {BRAND_FULL}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {copy.footer.tagline}
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/pricing" className="hover:text-[#3b66ff] transition" style={{ color: "var(--text-secondary)" }}>
            {copy.nav.pricing}
          </Link>
          <Link href="/login" className="hover:text-[#3b66ff] transition" style={{ color: "var(--text-secondary)" }}>
            {copy.nav.login}
          </Link>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {year} {copy.footer.rights}
        </p>
      </div>
    </footer>
  );
}
