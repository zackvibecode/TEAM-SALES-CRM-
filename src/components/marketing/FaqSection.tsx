"use client";

import { useMarketingLocale } from "./MarketingLocaleProvider";

export function FaqSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-8"
          style={{ color: "var(--text-primary)" }}
        >
          {copy.faq.title}
        </h2>
        <div className="space-y-4">
          {copy.faq.items.map((item) => (
            <details key={item.q} className="card-padded-sm group">
              <summary
                className="font-bold cursor-pointer list-none flex justify-between items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                {item.q}
                <span className="text-[#3b66ff] text-lg group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
