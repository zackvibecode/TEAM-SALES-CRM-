"use client";

import { Check, X } from "lucide-react";
import { FEATURE_ORDER, PRICING_TIERS } from "@/lib/marketing/pricing-tiers";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function PricingCompareTable() {
  const { copy } = useMarketingLocale();
  const p = copy.pricing;

  return (
    <div className="table-shell overflow-x-auto !rounded-3xl">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="table-head">
            <th className="table-th text-left !p-5 !text-sm !font-bold !normal-case !tracking-normal" style={{ color: "var(--text-primary)" }}>
              {p.compareTitle}
            </th>
            {PRICING_TIERS.map((tier) => (
              <th
                key={tier.id}
                className="table-th !p-5 !text-sm !font-bold text-center !normal-case !tracking-normal"
                style={{ color: "var(--text-primary)" }}
              >
                {p.tierNames[tier.id]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_ORDER.map((key) => (
            <tr key={key} className="table-row">
              <td className="p-5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                {p.featureLabels[key]}
              </td>
              {PRICING_TIERS.map((tier) => (
                <td key={tier.id} className="p-5 text-center">
                  {tier.features[key] ? (
                    <Check className="w-5 h-5 mx-auto" style={{ color: "#4f9e2c" }} aria-label="Yes" />
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
