import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { deleteFollowUp } from "@/lib/sales-follow-up/service";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

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
