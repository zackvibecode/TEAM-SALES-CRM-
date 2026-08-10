import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  bulkAssignPic,
  bulkCreateFollowUps,
  bulkDeleteLeads,
} from "@/lib/sales-follow-up/service";
import { assertLeadAccess, resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { logSalesFollowUpEvent } from "@/lib/sales-follow-up/audit";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

type BulkAction = "delete" | "assign" | "follow_up";

export async function POST(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const body = (await request.json()) as {
      action?: BulkAction;
      leadIds?: string[];
      picId?: string;
    };

    const action = body.action;
    const leadIds = Array.isArray(body.leadIds)
      ? [...new Set(body.leadIds.filter(Boolean))]
      : [];

    if (!action || leadIds.length === 0) {
      const e = sfError(SF_ERROR.GENERIC, 400, "action and leadIds required");
      return NextResponse.json(e.body, { status: e.status });
    }

    const allowed: string[] = [];
    for (const id of leadIds) {
      const access = await assertLeadAccess(ctx.db, ctx.role, ctx.user.id, id);
      if (access.ok) allowed.push(id);
    }

    if (allowed.length === 0) {
      const e = sfError(SF_ERROR.LEAD_FORBIDDEN, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

    const userName =
      (ctx.user.user_metadata?.full_name as string | undefined) ||
      ctx.user.email ||
      "Unknown";

    if (action === "delete") {
      const count = await bulkDeleteLeads(ctx.db, allowed);
      await logSalesFollowUpEvent(ctx.db, {
        userId: ctx.user.id,
        userName,
        action: "bulk_delete",
        details: { leadIds: allowed, count },
      });
      return NextResponse.json({ ok: true, count });
    }

    if (action === "assign") {
      if (ctx.role !== "admin") {
        const e = sfError(SF_ERROR.GENERIC, 403, "Only admin can bulk assign PIC");
        return NextResponse.json(e.body, { status: e.status });
      }
      if (!body.picId) {
        const e = sfError(SF_ERROR.GENERIC, 400, "picId required");
        return NextResponse.json(e.body, { status: e.status });
      }
      const count = await bulkAssignPic(ctx.db, allowed, body.picId);
      await logSalesFollowUpEvent(ctx.db, {
        userId: ctx.user.id,
        userName,
        action: "bulk_assign",
        picId: body.picId,
        details: { leadIds: allowed, count },
      });
      return NextResponse.json({ ok: true, count });
    }

    if (action === "follow_up") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id);
      const picId = ctx.role === "sales" ? scoped.picId : body.picId ?? null;
      const count = await bulkCreateFollowUps(ctx.db, allowed, picId);
      await logSalesFollowUpEvent(ctx.db, {
        userId: ctx.user.id,
        userName,
        action: "bulk_follow_up",
        picId: picId ?? undefined,
        details: { leadIds: allowed, count },
      });
      return NextResponse.json({ ok: true, count });
    }

    const e = sfError(SF_ERROR.GENERIC, 400, "Unknown action");
    return NextResponse.json(e.body, { status: e.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bulk action failed";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
