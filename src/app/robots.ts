import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_CRM_BASE_URL?.replace(/\/$/, "") ||
  "https://salescrm.zaqone.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing"],
        disallow: [
          "/login",
          "/admin/",
          "/dashboard/",
          "/api/",
          "/r/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
