"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";
import { Reveal } from "./Reveal";

export function ProblemSection() {
  const { copy } = useMarketingLocale();

  return (
    <section className="m-section" style={{ background: "var(--surface-muted)" }}>
      <div className="m-container">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="m-h2">{copy.problem.title}</h2>
        </Reveal>
        <div className="mt-12 grid md:grid-cols-2 gap-6 items-stretch">
          <Reveal delay={1} className="h-full">
            <ul className="m-card h-full p-7 sm:p-9 space-y-5">
              {copy.problem.items.map((item) => (
                <li key={item} className="flex gap-3.5 text-[15px] sm:text-base leading-relaxed">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-warning-500)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={2} className="h-full">
            <div
              className="m-card h-full p-7 sm:p-9 border-2"
              style={{ borderColor: "#9fe870", background: "linear-gradient(160deg, rgba(233,247,218,0.6), var(--surface-card) 65%)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#9fe870", color: "#163300" }}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="m-h3">{copy.problem.solutionTitle}</h3>
              <p className="mt-3 m-lead !text-base">{copy.problem.solutionText}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
