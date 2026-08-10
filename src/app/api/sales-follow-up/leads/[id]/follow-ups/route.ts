import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeadFollowUps,
  createFollowUp,
} from "@/lib/sales-follow-up/service";
import { assertLeadAccess, resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";
import type { CreateFollowUpInput } from "@/lib/sales-follow-up/types";

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

  const { id: leadId } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, leadId);
  if (!access.ok) return accessErrorResponse(access);

  try {
    const followUps = await getLeadFollowUps(ctx.db, leadId);
    return NextResponse.json({ followUps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch follow-ups";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id: leadId } = await params;
  const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, leadId);
  if (!access.ok) return accessErrorResponse(access);

  try {
    const body: CreateFollowUpInput = await request.json();
    body.lead_id = leadId;

    if (ctx.role === "sales") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id);
      body.pic_id = scoped.picId;
    }

    const followUp = await createFollowUp(ctx.db, body);
    return NextResponse.json({ followUp }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create follow-up";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
