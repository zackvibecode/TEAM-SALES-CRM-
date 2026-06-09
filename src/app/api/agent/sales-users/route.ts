import { NextRequest, NextResponse } from "next/server";
import { requireAgentAuth } from "@/lib/agent-auth";
import { listSalesUsers } from "@/lib/agent/sales-monitor";
import { createDbClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAgentAuth(request);
  if ("error" in auth) return auth.error;

  try {
    const db = createDbClient();
    const users = await listSalesUsers(db);
    return NextResponse.json({ users, count: users.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list sales users";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
