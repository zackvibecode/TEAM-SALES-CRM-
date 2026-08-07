import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeadById,
  updateLead,
  deleteLead,
  checkDuplicatePhone,
} from "@/lib/sales-follow-up/service";
import { assertLeadAccess, resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { UpdateLeadInput } from "@/lib/sales-follow-up/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const lead = await getLeadById(ctx.db, id);
    if (!lead) {
      return NextResponse.json({ error: "Lead tidak dijumpai." }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const body: UpdateLeadInput = await request.json();

    if (ctx.role === "sales") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id);
      body.assigned_pic_id = scoped.picId ?? null;
    }

    if (body.phone_number) {
      const isDuplicate = await checkDuplicatePhone(ctx.db, body.phone_number, id);
      if (isDuplicate) {
        return NextResponse.json(
          { error: "Nombor telefon ini sudah berada dalam database." },
          { status: 409 }
        );
      }
    }

    const lead = await updateLead(ctx.db, id, body);
    return NextResponse.json({ lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update lead";
    const status = message.includes("sudah berada") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can delete leads.
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin boleh padam lead." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteLead(ctx.db, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
