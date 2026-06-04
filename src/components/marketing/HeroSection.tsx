"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { ProductPhonePreview } from "./ProductPhonePreview";

export function HeroSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-22 lg:pb-28">
      <div
        className="absolute inset-0 -z-10 opacity-50 motion-reduce:opacity-30"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 15% 20%, rgba(59, 102, 255, 0.2), transparent 55%), radial-gradient(ellipse 50% 45% at 85% 30%, rgba(37, 211, 102, 0.1), transparent 50%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 xl:gap-14 items-center">
          {/* Left: headline */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#3b66ff] dark:bg-[#1e3a8a]/40 dark:text-[#93c5fd] mb-5">
              {copy.hero.badge}
            </span>
            <h1
              className="text-3xl sm:text-4xl xl:text-[2.75rem] font-extrabold tracking-tight leading-[1.15]"
              style={{ color: "var(--text-primary)" }}
            >
              {copy.hero.title}
            </h1>
            <p
              className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0"
              style={{ color: "var(--text-muted)" }}
            >
              {copy.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Link href="/pricing" className="btn-primary-solid px-6 py-3.5 w-full sm:w-auto">
                {copy.hero.ctaPricing}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3.5 w-full sm:w-auto">
                {copy.hero.ctaLogin}
              </Link>
            </div>
          </div>

          {/* Right: iPhone + real app preview */}
          <div className="flex justify-center lg:justify-end pt-2 lg:pt-0">
            <ProductPhonePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
