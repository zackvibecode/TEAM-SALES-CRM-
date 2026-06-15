import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;

    const { data: existing } = await ctx.db
      .from("team_sales")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Team sale not found" }, { status: 404 });
    }

    if (ctx.role !== "admin" && existing.sales_user_id !== ctx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const package_name = (body.package_name as string)?.trim();
    const lead_source = (body.lead_source as string)?.trim() ?? "";
    const sale_amount = Number(body.sale_amount ?? 0);
    const notes = (body.notes as string)?.trim() ?? "";

    if (!package_name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    const { data, error } = await ctx.db
      .from("team_sales")
      .update({
        package_name,
        lead_source,
        sale_amount,
        notes,
      })
      .eq("id", id)
      .select("*, profiles!team_sales_sales_user_id_fkey(full_name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile = (data as Record<string, unknown>).profiles as { full_name?: string } | null;
    const sale = {
      ...(data as Record<string, unknown>),
      profiles: undefined,
      sales_user_name: profile?.full_name ?? "Unknown",
    };

    return NextResponse.json({ sale });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update team sale";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;

    const { data: existing } = await ctx.db
      .from("team_sales")
      .select("sales_user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Team sale not found" }, { status: 404 });
    }

    if (ctx.role !== "admin" && existing.sales_user_id !== ctx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await ctx.db.from("team_sales").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete team sale";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
