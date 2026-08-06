"use client";

import { Plus } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

export function FaqSection() {
  const { copy } = useMarketingLocale();

  return (
    <section id="faq" className="m-section scroll-mt-20">
      <div className="m-container max-w-3xl">
        <Reveal className="text-center">
          <h2 className="m-h2">{copy.faq.title}</h2>
        </Reveal>
        <div className="mt-12 space-y-3.5">
          {copy.faq.items.map((item, i) => (
            <Reveal key={item.q} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <details className="faq-item group">
                <summary>
                  <span className="text-[15px] sm:text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    {item.q}
                  </span>
                  <span className="faq-icon" aria-hidden>
                    <Plus className="w-4 h-4" />
                  </span>
                </summary>
                <p className="px-6 pb-5 -mt-1 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
