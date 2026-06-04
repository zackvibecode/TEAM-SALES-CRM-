"use client";

import { Check, X } from "lucide-react";
import { getSalesContactUrl } from "@/lib/marketing/contact";
import { FEATURE_ORDER, type PricingTier } from "@/lib/marketing/pricing-tiers";
import { useMarketingLocale } from "./MarketingLocaleProvider";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const { copy } = useMarketingLocale();
  const p = copy.pricing;
  const contactUrl = getSalesContactUrl();
  const tierName = p.tierNames[tier.id];
  const tierDesc = p.tierDescriptions[tier.id];
  const highlightedFeatures = FEATURE_ORDER.filter((key) => tier.features[key]).slice(0, 6);

  return (
    <article
      className={`card-padded flex flex-col h-full relative ${
        tier.popular ? "ring-2 ring-[#3b66ff] shadow-lg" : ""
      }`}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-[#3b66ff] text-white">
          {p.popular}
        </span>
      )}
      <div className="mb-4">
        <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {tierName}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {tierDesc}
        </p>
      </div>
      <div className="mb-2">
        <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
          RM{tier.priceMonthly}
        </span>
        <span className="text-sm font-medium ml-1" style={{ color: "var(--text-muted)" }}>
          {p.perMonth}
        </span>
      </div>
      <p className="text-xs font-semibold mb-6" style={{ color: "var(--text-secondary)" }}>
        {p.seatLine(tier.adminSeats, tier.salesSeats)}
      </p>
      <ul className="space-y-2 flex-1 mb-6">
        {highlightedFeatures.map((key) => (
          <li key={key} className="flex gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span style={{ color: "var(--text-secondary)" }}>{p.featureLabels[key]}</span>
          </li>
        ))}
        {FEATURE_ORDER.filter((key) => !tier.features[key])
          .slice(0, 2)
          .map((key) => (
            <li key={key} className="flex gap-2 text-sm opacity-60">
              <X className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-muted)" }}>{p.featureLabels[key]}</span>
            </li>
          ))}
      </ul>
      <a
        href={contactUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={tier.popular ? "btn-primary-solid w-full py-3 text-center" : "btn-secondary w-full py-3 text-center"}
      >
        {p.contactSales}
      </a>
    </article>
  );
}
