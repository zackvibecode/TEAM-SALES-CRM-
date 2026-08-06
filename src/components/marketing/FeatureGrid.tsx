"use client";

import {
  Upload,
  LayoutDashboard,
  CalendarClock,
  MessageCircle,
  List,
  Target,
  Activity,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

const FEATURE_ICONS: LucideIcon[] = [
  Upload,
  LayoutDashboard,
  CalendarClock,
  MessageCircle,
  List,
  Target,
  Activity,
  Shield,
];

export function FeatureGrid() {
  const { copy } = useMarketingLocale();

  return (
    <section id="features" className="m-section scroll-mt-20">
      <div className="m-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="m-eyebrow">{copy.footer.productLinks[0]?.label ?? "Features"}</span>
          <h2 className="m-h2">{copy.features.title}</h2>
          <p className="m-lead mt-4 !text-base">{copy.features.subtitle}</p>
        </Reveal>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {copy.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i] ?? Upload;
            return (
              <Reveal key={item.title} delay={(i % 4) as 0 | 1 | 2 | 3} className="h-full">
                <article className="m-card h-full p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_-20px_rgba(22,51,0,0.28)] motion-reduce:hover:translate-y-0">
                  <div className="m-icon-tile mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {item.description}
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
