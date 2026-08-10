import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeads,
  createLead,
  checkDuplicatePhone,
} from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";
import type { FollowUpFilterParams, CreateLeadInput } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  const { searchParams } = new URL(request.url);
  const scoped = await resolveScopedPicId(
    ctx.db,
    ctx.role,
    ctx.user.id,
    searchParams.get("picId")
  );
  if (scoped.error) {
    const e = sfError(SF_ERROR.PIC_NOT_LINKED, 403);
    return NextResponse.json(e.body, { status: e.status });
  }

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: scoped.picId,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
    search: searchParams.get("search") || undefined,
    followUpFilter:
      (searchParams.get("followUpFilter") as FollowUpFilterParams["followUpFilter"]) || "all",
  };

  try {
    const leads = await getLeads(ctx.db, filters);
    return NextResponse.json({ leads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch leads";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const body: CreateLeadInput = await request.json();

    if (!body.phone_number || !body.phone_number.trim()) {
      const e = sfError(SF_ERROR.PHONE_REQUIRED, 400);
      return NextResponse.json(e.body, { status: e.status });
    }

    const scoped = await resolveScopedPicId(
      ctx.db,
      ctx.role,
      ctx.user.id,
      body.assigned_pic_id
    );
    if (scoped.error) {
      const e = sfError(SF_ERROR.PIC_NOT_LINKED, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

    if (ctx.role === "sales") {
      body.assigned_pic_id = scoped.picId;
    }

    const isDuplicate = await checkDuplicatePhone(ctx.db, body.phone_number);
    if (isDuplicate) {
      const e = sfError(SF_ERROR.PHONE_DUPLICATE, 409);
      return NextResponse.json(e.body, { status: e.status });
    }

    const lead = await createLead(ctx.db, body);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create lead";
    const code = /sudah berada|duplicate|23505/i.test(message)
      ? SF_ERROR.PHONE_DUPLICATE
      : SF_ERROR.GENERIC;
    const e = sfError(code, code === SF_ERROR.PHONE_DUPLICATE ? 409 : 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
