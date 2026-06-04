"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

export function ProblemSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-10"
          style={{ color: "var(--text-primary)" }}
        >
          {copy.problem.title}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ul className="card-padded space-y-4">
            {copy.problem.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span style={{ color: "var(--text-secondary)" }}>{item}</span>
              </li>
            ))}
          </ul>
          <div className="card-padded border-2 border-[#3b66ff]/30 bg-[#eef2ff]/50 dark:bg-[#1e3a8a]/20">
            <div className="flex gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-[#3b66ff] shrink-0" />
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {copy.problem.solutionTitle}
              </h3>
            </div>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {copy.problem.solutionText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
