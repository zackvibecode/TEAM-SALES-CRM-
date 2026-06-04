import { Suspense } from "react";
import { MarketingLocaleProvider } from "@/components/marketing/MarketingLocaleProvider";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center app-shell">
          <div className="w-10 h-10 rounded-full border-2 border-[#3b66ff] border-t-transparent animate-spin" />
        </div>
      }
    >
      <MarketingLocaleProvider>
        <div className="min-h-screen flex flex-col app-shell">
          <MarketingNav />
          <main className="flex-1">{children}</main>
          <MarketingFooter />
        </div>
      </MarketingLocaleProvider>
    </Suspense>
  );
}
