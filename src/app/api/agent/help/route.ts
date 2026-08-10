import { NextResponse } from "next/server";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";

/** Public instructions — no auth. */
export async function GET() {
  return NextResponse.json({
    service: "Zaqone CRM Agent + MCP",
    auth: "MCP Plugin = OAuth + paste zaqone_ key on authorize page. Custom GPT Actions = X-API-Key. Never email/password.",
    base_url: CRM_PUBLIC_BASE_URL,
    mcp_url: `${CRM_PUBLIC_BASE_URL}/api/mcp`,
    chatgpt_openapi: `${CRM_PUBLIC_BASE_URL}/agent-openapi.json`,
    admin_docs_url: `${CRM_PUBLIC_BASE_URL}/admin/api-key#chatgpt`,
    chatgpt_mcp_setup: [
      "1. Admin → AI API Key / ChatGPT → Generate zaqone_...",
      `2. ChatGPT New Plugin → Server URL = ${CRM_PUBLIC_BASE_URL}/api/mcp`,
      "3. Authentication = OAuth (not API key field in that screen)",
      "4. Create → authorize page → paste zaqone_ key → Authorize",
      "5. Ask: List sales users / Summary for alip last 30 days",
    ],
    chatgpt_actions_setup: [
      "1. Create a GPT → Actions → Import OpenAPI URL",
      `2. ${CRM_PUBLIC_BASE_URL}/agent-openapi.json`,
      "3. Auth = API Key header X-API-Key",
    ],
    do_not: [
      "Do NOT paste agent-openapi.json into MCP Plugin Server URL",
      "Do NOT open CRM website login",
      "Do NOT use email/password",
    ],
    endpoints: [
      { path: "/api/mcp", desc: "ChatGPT MCP Plugin (OAuth)" },
      { path: "/api/agent/test", desc: "REST test connection" },
      { path: "/api/agent/sales-users", desc: "List sales reps" },
      { path: "/api/agent/sales-user/{slug}/summary?days=30", desc: "Performance summary" },
    ],
  });
}
