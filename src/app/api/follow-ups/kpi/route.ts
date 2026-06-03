import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getFollowUpKpis, updateOverdueFollowUps } from "@/lib/follow-up/service";

export async function GET() {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await updateOverdueFollowUps(ctx.db);

    const kpis = await getFollowUpKpis(ctx.db, {
      role: ctx.role,
      userId: ctx.role === "sales" ? ctx.user.id : undefined,
    });

    return NextResponse.json({ kpis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load KPIs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
