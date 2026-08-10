import { NextResponse } from "next/server";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";

/** Public instructions — no auth. */
export async function GET() {
  return NextResponse.json({
    service: "Zaqone CRM Agent + MCP",
    auth: "MCP Plugin = OAuth + paste zaqone_ key on authorize page. REST/Hermes = X-API-Key or ?api_key=. Never email/password.",
    base_url: CRM_PUBLIC_BASE_URL,
    mcp_url: `${CRM_PUBLIC_BASE_URL}/api/mcp`,
    chatgpt_openapi: `${CRM_PUBLIC_BASE_URL}/agent-openapi.json`,
    admin_docs_url: `${CRM_PUBLIC_BASE_URL}/admin/api-key#chatgpt`,
    hermes_endpoints: {
      leads: `${CRM_PUBLIC_BASE_URL}/api/agent/leads?pic=fatin&limit=50`,
      follow_ups: `${CRM_PUBLIC_BASE_URL}/api/agent/follow-ups?queue=due_today&pic=fatin`,
      dashboard: `${CRM_PUBLIC_BASE_URL}/api/agent/dashboard`,
      pic_performance: `${CRM_PUBLIC_BASE_URL}/api/agent/pic-performance`,
      pics: `${CRM_PUBLIC_BASE_URL}/api/agent/pics`,
    },
    chatgpt_mcp_setup: [
      "1. Admin → AI API Key / ChatGPT → Generate zaqone_...",
      `2. ChatGPT New Plugin → Server URL = ${CRM_PUBLIC_BASE_URL}/api/mcp`,
      "3. Authentication = OAuth",
      "4. Create → authorize page → paste zaqone_ key → Authorize",
    ],
    hermes_setup: [
      `ZAQONE_CRM_URL=${CRM_PUBLIC_BASE_URL}`,
      "ZAQONE_API_KEY=zaqone_...",
      "Use /api/agent/leads and /api/agent/follow-ups (not website scrape)",
    ],
    do_not: [
      "Do NOT paste agent-openapi.json into MCP Plugin Server URL",
      "Do NOT open CRM website login",
      "Do NOT use email/password",
      "Do NOT scrape /admin dashboard",
    ],
    endpoints: [
      { path: "/api/agent/test", desc: "Test connection" },
      { path: "/api/agent/sales-users", desc: "Legacy sales reps" },
      { path: "/api/agent/pics", desc: "SFU PICs" },
      { path: "/api/agent/leads", desc: "SFU leads list" },
      { path: "/api/agent/follow-ups?queue=due_today", desc: "SFU follow-up queue" },
      { path: "/api/agent/leads/{id}/follow-ups", desc: "Lead follow-up history" },
      { path: "/api/agent/dashboard", desc: "SFU dashboard/report" },
      { path: "/api/agent/pic-performance", desc: "PIC performance report" },
      { path: "/api/mcp", desc: "ChatGPT MCP Plugin (OAuth)" },
    ],
  });
}
