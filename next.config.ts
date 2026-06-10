import type { NextConfig } from "next";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

if (process.env.VERCEL === "1" || process.env.CI === "true") {
  for (const key of required) {
    const val = process.env[key]?.trim();
    if (!val) {
      throw new Error(
        `Missing ${key}. Add it in Vercel → Project → Settings → Environment Variables, then Redeploy.`
      );
    }
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
