import { createDbClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";

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

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader badge="Security" title="Audit Log" subtitle="Admin actions: uploads, re-assign, delete, KPI" />
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="table-th">Time</th>
                  <th className="table-th">Admin</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Details</th>
                </tr>
              </thead>
              <tbody>
                {(logs || []).map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {new Date(log.created_at).toLocaleString("en-MY")}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      {(log.actor as { full_name?: string })?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{log.action}</td>
                    <td className="px-4 py-3 text-xs max-w-md truncate" style={{ color: "var(--text-muted)" }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
                {(!logs || logs.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      No audit entries yet. Run database migration first if upload fails.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
