import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  getLeadFollowUps,
  createFollowUp,
} from "@/lib/sales-follow-up/service";
import type { CreateFollowUpInput } from "@/lib/sales-follow-up/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;

  try {
    const followUps = await getLeadFollowUps(ctx.db, leadId);
    return NextResponse.json({ followUps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch follow-ups";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;

  try {
    const body: CreateFollowUpInput = await request.json();
    body.lead_id = leadId;

    if (!body.follow_up_date) {
      return NextResponse.json({ error: "Tarikh follow-up diperlukan." }, { status: 400 });
    }

    const followUp = await createFollowUp(ctx.db, body);
    return NextResponse.json({ followUp }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create follow-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
