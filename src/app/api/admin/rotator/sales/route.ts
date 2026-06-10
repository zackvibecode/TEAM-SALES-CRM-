import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeRotatorPhone } from "@/lib/rotator/whatsapp";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { data, error } = await auth.db
      .from("rotator_sales_members")
      .select("*")
      .order("rotation_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ members: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load sales team";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const phone = normalizeRotatorPhone((body.phone as string) || "");
    const isActive = body.is_active !== false;
    const rotationOrder = Number(body.rotation_order) || 0;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const { data, error } = await auth.db
      .from("rotator_sales_members")
      .insert({
        name,
        phone,
        is_active: isActive,
        rotation_order: rotationOrder,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add sales member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = body.id as string;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = (body.name as string).trim();
    if (body.phone !== undefined) updates.phone = normalizeRotatorPhone(body.phone as string);
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.rotation_order !== undefined) updates.rotation_order = Number(body.rotation_order);

    const { data, error } = await auth.db
      .from("rotator_sales_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update sales member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await auth.db.from("rotator_sales_members").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete sales member";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
