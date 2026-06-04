"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function HeroSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20">
      <div
        className="absolute inset-0 -z-10 opacity-40 motion-reduce:opacity-30"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(59, 102, 255, 0.25), transparent)",
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#3b66ff] dark:bg-[#1e3a8a]/40 dark:text-[#93c5fd] mb-6">
          {copy.hero.badge}
        </span>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {copy.hero.title}
        </h1>
        <p
          className="mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {copy.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/pricing" className="btn-primary-solid px-6 py-3.5 w-full sm:w-auto">
            {copy.hero.ctaPricing}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3.5 w-full sm:w-auto">
            {copy.hero.ctaLogin}
          </Link>
        </div>
      </div>
    </section>
  );
}
