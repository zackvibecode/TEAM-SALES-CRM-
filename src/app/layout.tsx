import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_CRM_BASE_URL?.replace(/\/$/, "") ||
      "https://salescrm.zaqone.com"
  ),
  title: {
    default: "Zaqone CRM by Zack",
    template: "%s | Zaqone CRM",
  },
  description:
    "CRM jualan & follow-up WhatsApp untuk pasukan travel. Urus lead, team performance, dan WhatsApp dalam satu tempat.",
  verification: {
    google: "mfchtig_bhBjX2y1aiIxiamI5GEIf9VmX4iuKmisRM4",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Zaqone CRM",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ms_MY",
    siteName: "Zaqone CRM",
    title: "Zaqone CRM by Zack",
    description:
      "CRM jualan & follow-up WhatsApp untuk pasukan travel.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zaqone CRM by Zack",
    description:
      "CRM jualan & follow-up WhatsApp untuk pasukan travel.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B66FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("zaqone-theme");if(t==="dark"||t==="light"){document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
