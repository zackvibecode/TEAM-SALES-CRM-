"use client";

import { Database, FileClock, ShieldCheck, type LucideIcon } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

const POINT_ICONS: LucideIcon[] = [ShieldCheck, FileClock, Database];

export function TrustSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="m-section" style={{ background: "var(--surface-muted)" }}>
      <div className="m-container">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
          <Reveal>
            <h2 className="m-h2">{copy.trust.title}</h2>
            <p className="m-lead mt-4 !text-base">{copy.trust.subtitle}</p>
          </Reveal>
          <div className="space-y-4">
            {copy.trust.points.map((point, i) => {
              const Icon = POINT_ICONS[i] ?? ShieldCheck;
              return (
                <Reveal key={point.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                  <div className="m-card flex gap-4 p-6 sm:p-7">
                    <div className="m-icon-tile">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        {point.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {point.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
