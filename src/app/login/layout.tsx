import { Suspense } from "react";
import { MarketingLocaleProvider } from "@/components/marketing/MarketingLocaleProvider";

export default function LoginLayout({
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
      <MarketingLocaleProvider>{children}</MarketingLocaleProvider>
    </Suspense>
  );
}
