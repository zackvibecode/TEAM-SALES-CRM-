import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_CRM_BASE_URL?.replace(/\/$/, "") ||
  "https://salescrm.zaqone.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
