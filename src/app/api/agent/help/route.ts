import { NextResponse } from "next/server";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";

/** Public instructions — no auth. Hermes can read this before connecting. */
export async function GET() {
  return NextResponse.json({
    service: "Zaqone CRM Agent API",
    auth: "API key only (zaqone_...). No email. No password. No browser login.",
    base_url: CRM_PUBLIC_BASE_URL,
    test_connection: `${CRM_PUBLIC_BASE_URL}/api/agent/test?api_key=YOUR_KEY`,
    chatgpt_openapi: `${CRM_PUBLIC_BASE_URL}/api/agent/openapi`,
    chatgpt_setup: [
      "1. Admin CRM → AI API Key (/admin/api-key) → Generate & copy zaqone_...",
      "2. Same page → section ChatGPT Custom GPT — follow docs + copy OpenAPI URL",
      "3. ChatGPT → Create a GPT → Configure → Actions → Import from URL",
      `4. Paste: ${CRM_PUBLIC_BASE_URL}/agent-openapi.json (or /api/agent/openapi)`,
      "5. Authentication → API Key → Header name X-API-Key → paste zaqone_ key",
      "6. Save GPT, then ask: List sales users / Summary for alip last 30 days",
    ],
    admin_docs_url: `${CRM_PUBLIC_BASE_URL}/admin/api-key#chatgpt`,
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
