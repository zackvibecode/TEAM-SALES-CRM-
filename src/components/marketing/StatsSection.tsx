"use client";

import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

export function StatsSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="m-section !py-14 sm:!py-20">
      <div className="m-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="m-h2 !text-[clamp(1.5rem,3vw,2.25rem)]">{copy.stats.title}</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {copy.stats.items.map((stat, i) => (
            <Reveal key={stat.label} delay={(i % 4) as 0 | 1 | 2 | 3} className="h-full">
              <div className="m-card h-full p-6 sm:p-8 text-center">
                <p
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums"
                  style={{ color: "#2e6b1c" }}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] sm:text-sm font-semibold leading-snug" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
