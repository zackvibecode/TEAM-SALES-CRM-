import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  deleteFollowUp,
  updateFollowUpStatus,
} from "@/lib/sales-follow-up/service";
import { assertLeadAccess } from "@/lib/sales-follow-up/access";
import { logSalesFollowUpEvent } from "@/lib/sales-follow-up/audit";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";
import type { FollowUpStatusType } from "@/lib/sales-follow-up/types";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as {
      status?: FollowUpStatusType;
      response?: string;
      lead_id?: string;
    };

    if (!body.status) {
      const e = sfError(SF_ERROR.GENERIC, 400, "status required");
      return NextResponse.json(e.body, { status: e.status });
    }

    const { data: existing, error: fetchError } = await ctx.db
      .from("lead_follow_ups")
      .select("id, lead_id, pic_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      const e = sfError(SF_ERROR.GENERIC, 404, "Follow-up not found");
      return NextResponse.json(e.body, { status: e.status });
    }

    const leadId = (existing as { lead_id: string }).lead_id;
    const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, leadId);
    if (!access.ok) return accessErrorResponse(access);

    const followUp = await updateFollowUpStatus(
      ctx.db,
      id,
      body.status,
      body.response
    );

    const userName =
      (ctx.user.user_metadata?.full_name as string | undefined) ||
      ctx.user.email ||
      "Unknown";

    await logSalesFollowUpEvent(ctx.db, {
      leadId,
      picId: (existing as { pic_id?: string | null }).pic_id ?? null,
      userId: ctx.user.id,
      userName,
      action: "follow_up_status_updated",
      details: { followUpId: id, status: body.status },
    });

    return NextResponse.json({ followUp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update follow-up";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
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

  if (ctx.role !== "admin") {
    const e = sfError(SF_ERROR.ADMIN_DELETE_FU_ONLY, 403);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { id } = await params;

  try {
    await deleteFollowUp(ctx.db, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete follow-up";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
