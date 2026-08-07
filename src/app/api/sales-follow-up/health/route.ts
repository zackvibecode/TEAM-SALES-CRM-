import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

const REQUIRED_TABLES = ["sales_pics", "sales_leads", "lead_follow_ups"] as const;

export async function GET() {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missing: string[] = [];
  const details: Record<string, string> = {};

  for (const table of REQUIRED_TABLES) {
    const { error } = await ctx.db.from(table).select("id").limit(1);
    if (error) {
      const msg = error.message || "unknown error";
      details[table] = msg;
      if (
        msg.includes("schema cache") ||
        msg.includes("does not exist") ||
        msg.includes("Could not find the table")
      ) {
        missing.push(table);
      }
    } else {
      details[table] = "ok";
    }
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        code: "MISSING_TABLES",
        missing,
        details,
        message:
          "Table Sales Follow-Up belum ready dalam Supabase project yang digunakan oleh live web. Jalankan fail fix-live.sql dalam SQL Editor project yang sama dengan NEXT_PUBLIC_SUPABASE_URL di Vercel Production.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, details, role: ctx.role });
}
