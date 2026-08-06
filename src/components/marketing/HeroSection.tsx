"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { LeadPreviewCard } from "./LeadPreviewCard";
import { Reveal } from "./Reveal";

export function HeroSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="relative overflow-hidden">
      {/* Soft brand wash */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(159, 232, 112, 0.22), transparent 60%), radial-gradient(ellipse 45% 40% at 0% 30%, rgba(159, 232, 112, 0.1), transparent 55%)",
        }}
      />

      <div className="m-container pt-14 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          {/* Left: headline */}
          <div className="text-center lg:text-left">
            <Reveal>
              <span className="m-eyebrow">{copy.hero.badge}</span>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="m-h1">{copy.hero.title}</h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="m-lead mt-6 max-w-xl mx-auto lg:mx-0">{copy.hero.subtitle}</p>
            </Reveal>
            <Reveal delay={3}>
              <div className="mt-9 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <Link href="/pricing" className="btn-primary-solid w-full sm:w-auto">
                  {copy.hero.ctaPricing}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-secondary w-full sm:w-auto">
                  {copy.hero.ctaLogin}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={3}>
              <ul className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5">
                <li
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#4f9e2c" }} />
                  Excel / CSV
                </li>
                <li
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" style={{ color: "#4f9e2c" }} />
                  WhatsApp
                </li>
                <li
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#4f9e2c" }} />
                  RLS
                </li>
                <li
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Clock className="w-4 h-4 shrink-0" style={{ color: "#4f9e2c" }} />
                  KPI
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Right: interactive CRM lead preview */}
          <Reveal delay={2} className="relative">
            <LeadPreviewCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
