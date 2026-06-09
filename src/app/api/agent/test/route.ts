import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import { listSalesUsers } from "@/lib/agent/sales-monitor";
import { createDbClient } from "@/lib/supabase/server";
import { CRM_PUBLIC_BASE_URL } from "@/lib/agent-api-key";

export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const db = createDbClient();
    const users = await listSalesUsers(db);

    return NextResponse.json({
      ok: true,
      connected: true,
      message: "Zaqone CRM API connected. No email/password login needed.",
      crm_url: CRM_PUBLIC_BASE_URL,
      sales_count: users.length,
      sales_users: users.map((u) => ({ name: u.full_name.trim(), slug: u.slug })),
      next_steps: [
        `GET ${CRM_PUBLIC_BASE_URL}/api/agent/sales-users?api_key=YOUR_KEY`,
        `GET ${CRM_PUBLIC_BASE_URL}/api/agent/sales-user/shiema/summary?days=30&api_key=YOUR_KEY`,
      ],
      do_not: [
        "Do NOT open the CRM website in a browser",
        "Do NOT use /api/auth/login",
        "Do NOT ask for email or password",
        "Do NOT use Vercel bypass token on salescrm.zaqone.com",
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
