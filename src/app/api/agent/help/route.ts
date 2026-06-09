import { NextResponse } from "next/server";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";

/** Public instructions — no auth. Hermes can read this before connecting. */
export async function GET() {
  return NextResponse.json({
    service: "Zaqone CRM Agent API",
    auth: "API key only (zaqone_...). No email. No password. No browser login.",
    base_url: CRM_PUBLIC_BASE_URL,
    test_connection: `${CRM_PUBLIC_BASE_URL}/api/agent/test?api_key=YOUR_KEY`,
    how_to_send_key: [
      "Header: X-API-Key: zaqone_...",
      "Query: ?api_key=zaqone_...",
      "Header: Authorization: Bearer zaqone_...",
    ],
    endpoints: [
      { path: "/api/agent/test", desc: "Test connection (start here)" },
      { path: "/api/agent/sales-users", desc: "List all sales reps" },
      { path: "/api/agent/sales-user/{slug}/summary?days=30", desc: "Performance summary" },
      { path: "/api/agent/sales-user/{slug}/activity?limit=50", desc: "Recent activity" },
    ],
    example_slugs: { SHIEMA: "shiema", ALIP: "alip" },
    hermes_env: {
      ZAQONE_CRM_URL: CRM_PUBLIC_BASE_URL,
      ZAQONE_API_KEY: "paste zaqone_ key from Admin dashboard",
    },
  });
}
