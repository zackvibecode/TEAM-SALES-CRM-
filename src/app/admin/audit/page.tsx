import { createDbClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminAuditClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const { data: logs } = await db
    .from("audit_logs")
    .select("*, actor:actor_id (full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminAuditClient logs={logs || []} />;
}
