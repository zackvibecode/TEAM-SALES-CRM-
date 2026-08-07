import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getPics, insertSeedPics } from "@/lib/sales-follow-up/service";
import { resolvePicForSalesUser } from "@/lib/sales-follow-up/access";

export async function GET() {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (ctx.role === "admin") {
      await insertSeedPics(ctx.db);
      const pics = await getPics(ctx.db);
      return NextResponse.json({ pics, mode: "admin" });
    }

    const pic = await resolvePicForSalesUser(ctx.db, ctx.user.id);
    return NextResponse.json({
      pics: pic ? [pic] : [],
      mode: "sales",
      myPicId: pic?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch PICs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
