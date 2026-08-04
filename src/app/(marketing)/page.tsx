import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getCopy } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: getCopy("en").meta.homeTitle,
  description: getCopy("en").meta.homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: getCopy("en").meta.homeTitle,
    description: getCopy("en").meta.homeDescription,
    url: "/",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return <LandingPage />;
}
