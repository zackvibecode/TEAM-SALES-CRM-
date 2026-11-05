import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    // Sales users only see progress for leads assigned to their own PIC.
    let scopePicId: string | null = null;
    if (ctx.role !== "admin") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id, null);
      if (scoped.error || !scoped.picId) {
        return NextResponse.json({ batches: [] });
      }
      scopePicId = scoped.picId;
    }
    // uploaded_by_user_id (migration 023) mungkin belum wujud — fallback tanpa owner
    interface BatchRow {
      id: string;
      batch_name: string;
      file_name: string;
      total_leads: number;
      assign_mode: string;
      uploaded_by: string | null;
      uploaded_by_user_id?: string | null;
      created_at: string;
    }
    let batches: BatchRow[] | null = null;
    const withOwner = await ctx.db
      .from("sales_lead_batches")
      .select(
        "id, batch_name, file_name, total_leads, assign_mode, uploaded_by, uploaded_by_user_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (withOwner.error && /uploaded_by_user_id/.test(withOwner.error.message)) {
      const retry = await ctx.db
        .from("sales_lead_batches")
        .select("id, batch_name, file_name, total_leads, assign_mode, uploaded_by, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (retry.error) throw new Error(`Failed to fetch batches: ${retry.error.message}`);
      batches = retry.data as unknown as BatchRow[];
    } else if (withOwner.error) {
      throw new Error(`Failed to fetch batches: ${withOwner.error.message}`);
    } else {
      batches = withOwner.data as unknown as BatchRow[];
    }

    // Count completed (>=3 follow-ups) and total linked leads per batch.
    // Kept as one query over sales_leads grouped in JS to stay RLS-friendly.
    const batchIds = (batches ?? []).map((b) => b.id as string);
    const counts = new Map<string, { total: number; completed: number }>();
    if (batchIds.length > 0) {
      for (let i = 0; i < batchIds.length; i += 50) {
        const chunk = batchIds.slice(i, i + 50);
        const { data: leadRows, error: leadErr } = await ctx.db
          .from("sales_leads")
          .select("batch_id, total_follow_ups")
          .in("batch_id", chunk)
          .eq("assigned_pic_id", scopePicId ?? "00000000-0000-0000-0000-000000000000");
        if (leadErr) throw new Error(`Failed to fetch batch progress: ${leadErr.message}`);
        for (const row of (leadRows ?? []) as Array<{
          batch_id: string;
          total_follow_ups: number;
        }>) {
          const entry = counts.get(row.batch_id) ?? { total: 0, completed: 0 };
          entry.total += 1;
          if (row.total_follow_ups >= 3) entry.completed += 1;
          counts.set(row.batch_id, entry);
        }
      }
    }

    const result = (batches ?? [])
      .map((b) => {
        const c = counts.get(b.id) ?? { total: 0, completed: 0 };
        // Sales scope: only their own assigned leads count.
        // Admin scope: fall back to the recorded batch total when no rows found.
        const total = scopePicId ? c.total : c.total > 0 ? c.total : (b.total_leads as number);
        const completed = c.completed;
        return {
          id: b.id,
          batchName: b.batch_name,
          fileName: b.file_name,
          assignMode: b.assign_mode,
          uploadedBy: (b.uploaded_by as string) || "",
          isOwner:
            ctx.role === "admin" ||
            (b.uploaded_by_user_id ?? null) === ctx.user.id,
          createdAt: b.created_at,
          totalLeads: total,
          completedLeads: completed,
          pendingLeads: Math.max(0, total - completed),
          status: total > 0 && completed >= total ? "Complete" : "In Progress",
        };
      })
      // Sales users should not see batches they have no leads in.
      .filter((b) => !scopePicId || b.totalLeads > 0);

    return NextResponse.json({ batches: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch batches";
    const e = sfError(SF_ERROR.GENERIC, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
