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
      className={`m-card flex flex-col h-full relative p-7 sm:p-8 transition-all duration-200 ${
        tier.popular
          ? "border-2 !border-[#9fe870] shadow-[0_24px_48px_-24px_rgba(22,51,0,0.25)]"
          : "hover:-translate-y-1 motion-reduce:hover:translate-y-0"
      }`}
    >
      {tier.popular && (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-extrabold"
          style={{ background: "#9fe870", color: "#163300" }}
        >
          {p.popular}
        </span>
      )}
      <div className="mb-5">
        <h3 className="m-h3 !text-xl">{tierName}</h3>
        <p className="m-muted mt-1.5 !text-sm">{tierDesc}</p>
      </div>
      <div className="mb-2 flex items-baseline gap-1.5">
        <span
          className="text-4xl font-extrabold tracking-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          RM{tier.priceMonthly}
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          {p.perMonth}
        </span>
      </div>
      <p className="text-xs font-bold mb-7" style={{ color: "var(--text-secondary)" }}>
        {p.seatLine(tier.adminSeats, tier.salesSeats)}
      </p>
      <ul className="space-y-2.5 flex-1 mb-8">
        {highlightedFeatures.map((key) => (
          <li key={key} className="flex gap-2.5 text-sm">
            <Check className="w-[18px] h-[18px] shrink-0 mt-0.5" style={{ color: "#4f9e2c" }} />
            <span style={{ color: "var(--text-secondary)" }}>{p.featureLabels[key]}</span>
          </li>
        ))}
        {FEATURE_ORDER.filter((key) => !tier.features[key])
          .slice(0, 2)
          .map((key) => (
            <li key={key} className="flex gap-2.5 text-sm opacity-60">
              <X className="w-[18px] h-[18px] shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-muted)" }}>{p.featureLabels[key]}</span>
            </li>
          ))}
      </ul>
      <a
        href={contactUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={tier.popular ? "btn-primary-solid w-full text-center" : "btn-secondary w-full text-center"}
      >
        {p.contactSales}
      </a>
    </article>
  );
}
