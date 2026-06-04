"use client";

import { Check, X } from "lucide-react";
import { FEATURE_ORDER, PRICING_TIERS } from "@/lib/marketing/pricing-tiers";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function PricingCompareTable() {
  const { copy } = useMarketingLocale();
  const p = copy.pricing;

  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border-color)" }}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr style={{ background: "var(--surface-muted)" }}>
            <th className="text-left p-4 font-bold" style={{ color: "var(--text-primary)" }}>
              {p.compareTitle}
            </th>
            {PRICING_TIERS.map((tier) => (
              <th
                key={tier.id}
                className="p-4 font-bold text-center"
                style={{ color: "var(--text-primary)" }}
              >
                {p.tierNames[tier.id]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_ORDER.map((key) => (
            <tr key={key} className="border-t" style={{ borderColor: "var(--border-color)" }}>
              <td className="p-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                {p.featureLabels[key]}
              </td>
              {PRICING_TIERS.map((tier) => (
                <td key={tier.id} className="p-4 text-center">
                  {tier.features[key] ? (
                    <Check className="w-5 h-5 text-emerald-500 mx-auto" aria-label="Yes" />
                  ) : (
                    <X className="w-5 h-5 mx-auto opacity-40" style={{ color: "var(--text-muted)" }} aria-label="No" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
