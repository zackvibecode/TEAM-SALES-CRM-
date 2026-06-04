"use client";

import Link from "next/link";
import { getSalesContactUrl } from "@/lib/marketing/contact";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function FinalCtaSection() {
  const { copy } = useMarketingLocale();
  const contactUrl = getSalesContactUrl();

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center border"
          style={{
            borderColor: "var(--border-color)",
            background: "linear-gradient(135deg, rgba(59,102,255,0.12) 0%, var(--surface-card) 60%)",
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {copy.finalCta.title}
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
            {copy.finalCta.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pricing" className="btn-primary-solid px-6 py-3.5 w-full sm:w-auto">
              {copy.finalCta.ctaPricing}
            </Link>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-6 py-3.5 w-full sm:w-auto"
            >
              {copy.finalCta.ctaContact}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
