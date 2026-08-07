import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { deleteFollowUp } from "@/lib/sales-follow-up/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin boleh padam follow-up." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteFollowUp(ctx.db, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete follow-up";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
