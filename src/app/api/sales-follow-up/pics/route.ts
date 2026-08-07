import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPics, insertSeedPics } from "@/lib/sales-follow-up/service";

export async function GET() {
  const ctx = await getAuthenticatedContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await insertSeedPics(ctx.db);
    const pics = await getPics(ctx.db);
    return NextResponse.json({ pics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch PICs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
