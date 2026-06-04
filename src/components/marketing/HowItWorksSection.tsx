"use client";

import { useMarketingLocale } from "./MarketingLocaleProvider";

export function HowItWorksSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-10"
          style={{ color: "var(--text-primary)" }}
        >
          {copy.howItWorks.title}
        </h2>
        <ol className="grid md:grid-cols-3 gap-6">
          {copy.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="card-padded relative">
              <span
                className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-[#3b66ff] text-white text-sm font-bold flex items-center justify-center shadow-md"
                aria-hidden
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
