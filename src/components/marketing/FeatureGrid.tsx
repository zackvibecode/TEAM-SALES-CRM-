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
    <section className="py-14 sm:py-16" style={{ background: "var(--surface-muted)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {copy.features.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            {copy.features.subtitle}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {copy.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i] ?? Upload;
            return (
              <article key={item.title} className="card-padded-sm hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#eef2ff] dark:bg-[#1e3a8a]/40 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#3b66ff]" />
                </div>
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
