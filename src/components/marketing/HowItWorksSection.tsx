"use client";

import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

export function HowItWorksSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="m-section" style={{ background: "var(--surface-muted)" }}>
      <div className="m-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="m-h2">{copy.howItWorks.title}</h2>
        </Reveal>
        <ol className="mt-14 grid md:grid-cols-3 gap-5 md:gap-6">
          {copy.howItWorks.steps.map((step, index) => (
            <Reveal key={step.title} as="li" delay={(index % 4) as 0 | 1 | 2 | 3} className="h-full">
              <div className="m-card h-full p-7 sm:p-8 relative">
                <span
                  className="w-10 h-10 rounded-full text-base font-extrabold flex items-center justify-center mb-6"
                  style={{ background: "#9fe870", color: "#163300" }}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <h3 className="m-h3 !text-lg">{step.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
