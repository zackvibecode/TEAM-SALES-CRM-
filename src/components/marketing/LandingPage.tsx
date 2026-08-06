"use client";

import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { FeatureGrid } from "./FeatureGrid";
import { HowItWorksSection } from "./HowItWorksSection";
import { AudienceSection } from "./AudienceSection";
import { TrustSection } from "./TrustSection";
import { StatsSection } from "./StatsSection";
import { FaqSection } from "./FaqSection";
import { FinalCtaSection } from "./FinalCtaSection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <FeatureGrid />
      <HowItWorksSection />
      <AudienceSection />
      <TrustSection />
      <StatsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
