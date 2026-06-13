import { createDbClient } from "@/lib/supabase/server";

export type AuditAction =
  | "upload_leads"
  | "delete_file"
  | "reassign_batch"
  | "reassign_lead"
  | "archive_batch"
  | "create_sales_user"
  | "update_kpi"
  | "reset_all_crm_data"
  | "rotate_agent_api_key"
  | "create_promo"
  | "update_promo"
  | "delete_promo";

export async function logAudit(params: {
  actorId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const db = createDbClient();
    await db.from("audit_logs").insert({
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      details: params.details ?? {},
    });
  } catch {
    // Non-blocking if migration not applied yet
  }
}
