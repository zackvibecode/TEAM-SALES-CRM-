"use client";

import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { FeatureGrid } from "./FeatureGrid";
import { HowItWorksSection } from "./HowItWorksSection";
import { TrustSection } from "./TrustSection";
import { FinalCtaSection } from "./FinalCtaSection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <FeatureGrid />
      <HowItWorksSection />
      <TrustSection />
      <FinalCtaSection />
    </>
  );
}
