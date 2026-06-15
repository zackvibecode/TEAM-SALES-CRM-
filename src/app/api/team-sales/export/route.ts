import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = ctx.db
      .from("team_sales")
      .select("*, profiles!team_sales_sales_user_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("sales_user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const esc = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;

    const header = "Sales Person,Customer Name,Package,Lead Source,Amount (RM),PAX,Notes,Date\n";
    const rows = (data || [])
      .map((row: Record<string, unknown>) => {
        const profile = row.profiles as { full_name?: string } | null;
        const name = profile?.full_name || "Unknown";
        return [
          esc(name),
          esc((row.customer_name as string) || ""),
          esc(row.package_name as string),
          esc((row.lead_source as string) || ""),
          Number(row.sale_amount ?? 0).toFixed(2),
          String(row.pax ?? 1),
          esc((row.notes as string) || ""),
          esc(new Date(row.created_at as string).toLocaleDateString("en-MY")),
        ].join(",");
      })
      .join("\n");

    const csv = header + rows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Timsel Report.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
