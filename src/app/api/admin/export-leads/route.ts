import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const ownerUserId = searchParams.get("ownerUserId");
    const fileId = searchParams.get("fileId");

    const db = auth.db;
    let query = db
      .from("leads")
      .select("name, whatsapp, package_interest, status, notes, created_at, owner_user_id")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (ownerUserId) query = query.eq("owner_user_id", ownerUserId);
    if (fileId) query = query.eq("source_file_id", fileId);

    const { data: leads, error } = await query;
    if (error) throw new Error(error.message);

    const { data: owners } = await db.from("profiles").select("id, full_name").eq("role", "sales");
    const ownerMap = new Map((owners || []).map((o) => [o.id, o.full_name]));

    const header = "Name,WhatsApp,Package,Status,Notes,Owner,Created\n";
    const rows = (leads || [])
      .map((l) => {
        const esc = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
        return [
          esc(l.name),
          esc(l.whatsapp),
          esc(l.package_interest),
          esc(l.status),
          esc(l.notes),
          esc(ownerMap.get(l.owner_user_id) || ""),
          esc(l.created_at),
        ].join(",");
      })
      .join("\n");

    const csv = header + rows;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export-${Date.now()}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
