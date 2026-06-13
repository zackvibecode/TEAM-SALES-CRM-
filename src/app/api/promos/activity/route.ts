import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { listPromoActivity } from "@/lib/promo/service";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const promoId = searchParams.get("promo_id") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 50);

    const logs = await listPromoActivity(ctx.db, { promoId, limit });
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load promo activity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
