import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeads,
  createLead,
  checkDuplicatePhone,
} from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { FollowUpFilterParams, CreateLeadInput } from "@/lib/sales-follow-up/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scoped = await resolveScopedPicId(
    ctx.db,
    ctx.role,
    ctx.user.id,
    searchParams.get("picId")
  );
  if (scoped.error) {
    return NextResponse.json({ error: scoped.error }, { status: 403 });
  }

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: scoped.picId,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
    search: searchParams.get("search") || undefined,
    followUpFilter: (searchParams.get("followUpFilter") as FollowUpFilterParams["followUpFilter"]) || "all",
  };

  try {
    const leads = await getLeads(ctx.db, filters);
    return NextResponse.json({ leads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateLeadInput = await request.json();

    if (!body.phone_number || !body.phone_number.trim()) {
      return NextResponse.json({ error: "Nombor telefon diperlukan." }, { status: 400 });
    }

    const scoped = await resolveScopedPicId(
      ctx.db,
      ctx.role,
      ctx.user.id,
      body.assigned_pic_id
    );
    if (scoped.error) {
      return NextResponse.json({ error: scoped.error }, { status: 403 });
    }

    // Sales can only assign to themselves.
    if (ctx.role === "sales") {
      body.assigned_pic_id = scoped.picId;
    }

    const isDuplicate = await checkDuplicatePhone(ctx.db, body.phone_number);
    if (isDuplicate) {
      return NextResponse.json(
        { error: "Nombor telefon ini sudah berada dalam database." },
        { status: 409 }
      );
    }

    const lead = await createLead(ctx.db, body);
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create lead";
    const status = message.includes("sudah berada") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
