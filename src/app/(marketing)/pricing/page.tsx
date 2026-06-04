import type { Metadata } from "next";
import { PricingPage } from "@/components/marketing/PricingPage";
import { getCopy } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: getCopy("en").meta.pricingTitle,
  description: getCopy("en").meta.pricingDescription,
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
