import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createDbClient } from "@/lib/supabase/server";
import {
  getSalesUserActivity,
  getSalesUserDailyBreakdown,
  getSalesUserSummary,
  listSalesUsers,
  resolveSalesUserBySlug,
} from "@/lib/agent/sales-monitor";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";
import { mcpResourceUrl, verifyMcpAccessToken } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "test_connection",
      {
        description: "Test SaleCRM MCP connection and list sales slug hints.",
        inputSchema: z.object({}),
      },
      async () => {
        const db = createDbClient();
        const users = await listSalesUsers(db);
        return jsonText({
          ok: true,
          connected: true,
          crm_url: CRM_PUBLIC_BASE_URL,
          sales_count: users.length,
          sales_users: users.map((u) => ({ name: u.full_name.trim(), slug: u.slug })),
          note: "Auth is OAuth + CRM API key. Never ask for email/password or website login.",
        });
      }
    );

    server.registerTool(
      "list_sales_users",
      {
        description: "List all sales reps with name and slug.",
        inputSchema: z.object({}),
      },
      async () => {
        const db = createDbClient();
        const users = await listSalesUsers(db);
        return jsonText({ users, count: users.length });
      }
    );

    server.registerTool(
      "get_sales_summary",
      {
        description: "Performance summary for one sales user (default last 30 days).",
        inputSchema: z.object({
          slug: z.string().describe("Sales slug e.g. shiema, alip, fatin"),
          days: z.number().int().min(1).max(365).optional().describe("Lookback days (default 30)"),
        }),
      },
      async ({ slug, days }) => {
        const db = createDbClient();
        const user = await resolveSalesUserBySlug(db, slug);
        if (!user) {
          return jsonText({ error: `Sales user not found for slug: ${slug}` });
        }
        const summary = await getSalesUserSummary(db, user.id, days ?? 30);
        return jsonText(summary);
      }
    );

    server.registerTool(
      "get_sales_activity",
      {
        description: "Recent activity for one sales user.",
        inputSchema: z.object({
          slug: z.string().describe("Sales slug e.g. shiema, alip, fatin"),
          limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 50)"),
        }),
      },
      async ({ slug, limit }) => {
        const db = createDbClient();
        const user = await resolveSalesUserBySlug(db, slug);
        if (!user) {
          return jsonText({ error: `Sales user not found for slug: ${slug}` });
        }
        const activity = await getSalesUserActivity(db, user.id, limit ?? 50);
        return jsonText({ sales_user: user, activity });
      }
    );

    server.registerTool(
      "get_sales_daily_breakdown",
      {
        description: "Daily breakdown for one sales user.",
        inputSchema: z.object({
          slug: z.string().describe("Sales slug e.g. shiema, alip, fatin"),
          days: z.number().int().min(1).max(365).optional().describe("Lookback days (default 30)"),
        }),
      },
      async ({ slug, days }) => {
        const db = createDbClient();
        const user = await resolveSalesUserBySlug(db, slug);
        if (!user) {
          return jsonText({ error: `Sales user not found for slug: ${slug}` });
        }
        const rows = await getSalesUserDailyBreakdown(db, user.id, days ?? 30);
        return jsonText({ sales_user: user, days: days ?? 30, rows });
      }
    );
  },
  {
    serverInfo: {
      name: "zaqone-salecrm",
      version: "1.0.0",
    },
  }
);

const verifyToken = async (
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;
  const verified = await verifyMcpAccessToken(bearerToken);
  if (!verified) return undefined;
  return {
    token: verified.token,
    clientId: verified.clientId,
    scopes: verified.scopes,
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ["mcp:read"],
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
  resourceUrl: mcpResourceUrl(),
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
