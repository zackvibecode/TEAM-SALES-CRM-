"use client";

import { PRICING_TIERS } from "@/lib/marketing/pricing-tiers";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { PricingCard } from "./PricingCard";
import { PricingCompareTable } from "./PricingCompareTable";
import { FaqSection } from "./FaqSection";

export function PricingPage() {
  const { copy } = useMarketingLocale();

  return (
    <>
      <section className="pt-12 pb-8 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          {copy.pricing.title}
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
          {copy.pricing.subtitle}
        </p>
      </section>
      <section className="pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>
      <section className="pb-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <PricingCompareTable />
      </section>
      <FaqSection />
    </>
  );
}
