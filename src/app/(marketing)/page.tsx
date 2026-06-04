import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getCopy } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: getCopy("en").meta.homeTitle,
  description: getCopy("en").meta.homeDescription,
  openGraph: {
    title: getCopy("en").meta.homeTitle,
    description: getCopy("en").meta.homeDescription,
  },
};

export default function HomePage() {
  return <LandingPage />;
}
