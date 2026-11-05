import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

export const dynamic = "force-dynamic";

/** PATCH — rename batch (admin only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }
  if (ctx.role !== "admin") {
    const e = sfError(SF_ERROR.ADMIN_DELETE_ONLY, 403);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { batchName?: string };
    const batchName = (body.batchName ?? "").trim();
    if (!batchName) {
      const e = sfError(SF_ERROR.GENERIC, 400, "batchName required");
      return NextResponse.json(e.body, { status: e.status });
    }

    const { data: updated, error } = await ctx.db
      .from("sales_lead_batches")
      .update({ batch_name: batchName })
      .eq("id", id)
      .select("id, batch_name")
      .single();
    if (error || !updated) {
      const e = sfError(SF_ERROR.GENERIC, 404, "Batch not found");
      return NextResponse.json(e.body, { status: e.status });
    }

    return NextResponse.json({ batch: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update batch";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}

/** DELETE — padam rekod batch sahaja. Leads kekal (batch_id set null). Admin only. */
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
    const e = sfError(SF_ERROR.ADMIN_DELETE_ONLY, 403);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const { id } = await params;

    // Lepaskan leads dari batch supaya tak orphan reference
    const { error: detachErr } = await ctx.db
      .from("sales_leads")
      .update({ batch_id: null })
      .eq("batch_id", id);
    if (detachErr) throw new Error(`Failed to detach leads: ${detachErr.message}`);

    const { error, count } = await ctx.db
      .from("sales_lead_batches")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(`Failed to delete batch: ${error.message}`);

    return NextResponse.json({ deleted: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete batch";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
