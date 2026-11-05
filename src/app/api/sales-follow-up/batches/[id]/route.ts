import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

export const dynamic = "force-dynamic";

/** Owner = user yang upload batch. Admin boleh semua batch. */
async function canManageBatch(
  db: SupabaseClient,
  role: string,
  userId: string,
  batchId: string
): Promise<{ ok: boolean; notFound?: boolean }> {
  // Cuba dengan uploaded_by_user_id (migration 023); fallback tanpa jika kolum belum wujud
  let batch: { id: string; uploaded_by_user_id?: string | null } | null = null;
  const withOwner = await db
    .from("sales_lead_batches")
    .select("id, uploaded_by_user_id")
    .eq("id", batchId)
    .maybeSingle();
  if (withOwner.error && /uploaded_by_user_id/.test(withOwner.error.message)) {
    const fallback = await db
      .from("sales_lead_batches")
      .select("id")
      .eq("id", batchId)
      .maybeSingle();
    if (fallback.error) return { ok: false };
    batch = fallback.data ? { id: fallback.data.id } : null;
  } else if (withOwner.error) {
    return { ok: false };
  } else {
    batch = withOwner.data as { id: string; uploaded_by_user_id?: string | null } | null;
  }
  if (!batch) return { ok: false, notFound: true };
  if (role === "admin") return { ok: true };
  return { ok: (batch.uploaded_by_user_id ?? null) === userId };
}

/** PATCH — rename batch (admin atau owner). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const { id } = await params;

    const gate = await canManageBatch(ctx.db, ctx.role, ctx.user.id, id);
    if (gate.notFound) {
      const e = sfError(SF_ERROR.GENERIC, 404, "Batch not found");
      return NextResponse.json(e.body, { status: e.status });
    }
    if (!gate.ok) {
      const e = sfError(SF_ERROR.ADMIN_DELETE_ONLY, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

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

/** DELETE — padam batch. scope:
 *  - "batch_only" (default): rekod batch sahaja, leads kekal (batch_id set null)
 *  - "with_leads": padam batch + semua leads dalam batch tersebut
 *  Admin atau owner batch sahaja.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const { id } = await params;
    const scope = new URL(request.url).searchParams.get("scope") === "with_leads"
      ? "with_leads"
      : "batch_only";

    const gate = await canManageBatch(ctx.db, ctx.role, ctx.user.id, id);
    if (gate.notFound) {
      const e = sfError(SF_ERROR.GENERIC, 404, "Batch not found");
      return NextResponse.json(e.body, { status: e.status });
    }
    if (!gate.ok) {
      const e = sfError(SF_ERROR.ADMIN_DELETE_ONLY, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

    let deletedLeads = 0;

    if (scope === "with_leads") {
      // Padam leads dalam batch (dalam chunk supaya tak timeout pada batch besar)
      for (let i = 0; ; i += 500) {
        const { data: removed, error: delErr } = await ctx.db
          .from("sales_leads")
          .delete()
          .eq("batch_id", id)
          .range(i, i + 499)
          .select("id");
        if (delErr) throw new Error(`Failed to delete leads: ${delErr.message}`);
        const n = (removed ?? []).length;
        deletedLeads += n;
        if (n < 500) break;
      }
    } else {
      // Lepaskan leads dari batch supaya tak orphan reference
      const { error: detachErr } = await ctx.db
        .from("sales_leads")
        .update({ batch_id: null })
        .eq("batch_id", id);
      if (detachErr) throw new Error(`Failed to detach leads: ${detachErr.message}`);
    }

    const { error, count } = await ctx.db
      .from("sales_lead_batches")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(`Failed to delete batch: ${error.message}`);

    return NextResponse.json({ deleted: count ?? 0, deletedLeads, scope });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete batch";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
