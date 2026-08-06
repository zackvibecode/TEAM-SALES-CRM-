"use client";

import { Briefcase, Headset, Inbox, UserRound, type LucideIcon } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

const AUDIENCE_ICONS: LucideIcon[] = [Briefcase, Headset, UserRound, Inbox];

export function AudienceSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="m-section">
      <div className="m-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="m-h2">{copy.audience.title}</h2>
          <p className="m-lead mt-4 !text-base">{copy.audience.subtitle}</p>
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {copy.audience.cards.map((card, i) => {
            const Icon = AUDIENCE_ICONS[i] ?? Briefcase;
            return (
              <Reveal key={card.title} delay={(i % 4) as 0 | 1 | 2 | 3} className="h-full">
                <article
                  className="h-full rounded-3xl p-6 sm:p-7 border transition-all duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--surface-muted)",
                  }}
                >
                  <div className="m-icon-tile mb-5" style={{ background: "var(--surface-card)" }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {card.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
