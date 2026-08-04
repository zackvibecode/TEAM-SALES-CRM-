import type { Metadata } from "next";
import { PricingPage } from "@/components/marketing/PricingPage";
import { getCopy } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: getCopy("en").meta.pricingTitle,
  description: getCopy("en").meta.pricingDescription,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: getCopy("en").meta.pricingTitle,
    description: getCopy("en").meta.pricingDescription,
    url: "/pricing",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
