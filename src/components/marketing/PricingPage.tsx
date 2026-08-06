"use client";

import { PRICING_TIERS } from "@/lib/marketing/pricing-tiers";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { PricingCard } from "./PricingCard";
import { PricingCompareTable } from "./PricingCompareTable";
import { FaqSection } from "./FaqSection";
import { Reveal } from "./Reveal";

export function PricingPage() {
  const { copy } = useMarketingLocale();

  return (
    <>
      <section className="m-container pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
        <Reveal>
          <h1 className="m-h1 !text-[clamp(2rem,4.5vw,3.25rem)]">{copy.pricing.title}</h1>
          <p className="m-lead mt-5 max-w-2xl mx-auto !text-base">{copy.pricing.subtitle}</p>
        </Reveal>
      </section>
      <section className="m-container pb-16 sm:pb-20">
        <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.id} delay={(i % 4) as 0 | 1 | 2 | 3} className="h-full">
              <PricingCard tier={tier} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="m-container pb-8 sm:pb-12">
        <Reveal>
          <PricingCompareTable />
        </Reveal>
      </section>
      <FaqSection />
    </>
  );
}
