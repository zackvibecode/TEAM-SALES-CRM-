import type { createDbClient } from "@/lib/supabase/server";

type DbClient = ReturnType<typeof createDbClient>;

export type SalesFollowUpEventAction =
  | "follow_up_created"
  | "follow_up_status_updated"
  | "lead_deleted"
  | "lead_status_updated"
  | "bulk_delete"
  | "bulk_assign"
  | "bulk_follow_up";

/** Best-effort audit log. Ignores failure if table not created yet. */
export async function logSalesFollowUpEvent(
  db: DbClient,
  params: {
    leadId?: string | null;
    picId?: string | null;
    userId: string;
    userName: string;
    action: SalesFollowUpEventAction;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { error } = await db.from("sales_follow_up_events").insert({
      lead_id: params.leadId ?? null,
      pic_id: params.picId ?? null,
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      details: params.details ?? {},
    });
    if (error) {
      // Table may not exist until SQL is run.
    }
  } catch {
    // ignore
  }
}
