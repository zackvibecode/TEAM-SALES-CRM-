import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (ctx.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const name = (body.name as string)?.trim();
    const is_active = body.is_active;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const updates: Record<string, unknown> = { name };
    if (typeof is_active === "boolean") updates.is_active = is_active;

    const { data, error } = await ctx.db
      .from("lead_sources")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ source: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update lead source";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (ctx.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { id } = await params;

    const { error } = await ctx.db
      .from("lead_sources")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete lead source";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
