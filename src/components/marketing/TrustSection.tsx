"use client";

import { Plane } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function TrustSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="card-padded text-center max-w-2xl mx-auto">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#eef2ff] dark:bg-[#1e3a8a]/40 items-center justify-center mb-4">
            <Plane className="w-6 h-6 text-[#3b66ff]" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {copy.trust.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
            {copy.trust.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
