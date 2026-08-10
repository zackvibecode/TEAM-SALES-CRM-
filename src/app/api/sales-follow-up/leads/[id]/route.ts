import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeadById,
  updateLead,
  deleteLead,
  checkDuplicatePhone,
} from "@/lib/sales-follow-up/service";
import { assertLeadAccess, resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";
import type { UpdateLeadInput } from "@/lib/sales-follow-up/types";

function accessErrorResponse(access: { error: string; status: number }) {
  const code =
    access.error === "LEAD_NOT_FOUND"
      ? SF_ERROR.LEAD_NOT_FOUND
      : access.error === "LEAD_FORBIDDEN"
        ? SF_ERROR.LEAD_FORBIDDEN
        : access.error === "PIC_NOT_LINKED"
          ? SF_ERROR.PIC_NOT_LINKED
          : SF_ERROR.GENERIC;
  const e = sfError(code, access.status);
  return NextResponse.json(e.body, { status: e.status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
  if (!access.ok) return accessErrorResponse(access);

  try {
    const lead = await getLeadById(ctx.db, id);
    if (!lead) {
      const e = sfError(SF_ERROR.LEAD_NOT_FOUND, 404);
      return NextResponse.json(e.body, { status: e.status });
    }
    return NextResponse.json({ lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch lead";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
  if (!access.ok) return accessErrorResponse(access);

  try {
    const body: UpdateLeadInput = await request.json();

    if (ctx.role === "sales") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id);
      body.assigned_pic_id = scoped.picId ?? null;
    }

    if (body.phone_number) {
      const isDuplicate = await checkDuplicatePhone(ctx.db, body.phone_number, id);
      if (isDuplicate) {
        const e = sfError(SF_ERROR.PHONE_DUPLICATE, 409);
        return NextResponse.json(e.body, { status: e.status });
      }
    }

    const lead = await updateLead(ctx.db, id, body);
    return NextResponse.json({ lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update lead";
    const code = /sudah berada|duplicate|23505/i.test(message)
      ? SF_ERROR.PHONE_DUPLICATE
      : SF_ERROR.GENERIC;
    const e = sfError(code, code === SF_ERROR.PHONE_DUPLICATE ? 409 : 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
  if (!access.ok) return accessErrorResponse(access);

  try {
    const lead = await getLeadById(ctx.db, id);
    const userName =
      (ctx.user.user_metadata?.full_name as string | undefined) ||
      ctx.user.email ||
      "Unknown";

    // Delete first — auditing with lead_id before delete can block via FK.
    await deleteLead(ctx.db, id);

    const { logSalesFollowUpEvent } = await import("@/lib/sales-follow-up/audit");
    await logSalesFollowUpEvent(ctx.db, {
      leadId: null,
      picId: lead?.assigned_pic_id ?? null,
      userId: ctx.user.id,
      userName,
      action: "lead_deleted",
      details: {
        lead_id: id,
        customer_name: lead?.customer_name,
        phone: lead?.phone_number,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete lead";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
