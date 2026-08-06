"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSalesContactUrl } from "@/lib/marketing/contact";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

export function FinalCtaSection() {
  const { copy } = useMarketingLocale();
  const contactUrl = getSalesContactUrl();

  return (
    <section className="m-section !pb-20 sm:!pb-28">
      <div className="m-container">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-20 text-center"
            style={{ background: "#163300" }}
          >
            {/* subtle brand glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 55% 60% at 50% -10%, rgba(159,232,112,0.28), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="m-h2" style={{ color: "#f4fbec" }}>
                {copy.finalCta.title}
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg leading-relaxed" style={{ color: "#c2e894" }}>
                {copy.finalCta.subtitle}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/pricing" className="btn-primary-solid w-full sm:w-auto">
                  {copy.finalCta.ctaPricing}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[15px] rounded-full px-6 py-3 min-h-[48px] w-full sm:w-auto border transition"
                  style={{ borderColor: "rgba(194,232,148,0.4)", color: "#f4fbec" }}
                >
                  {copy.finalCta.ctaContact}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
