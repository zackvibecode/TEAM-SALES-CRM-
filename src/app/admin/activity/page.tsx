import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivityLogTable } from "@/components/activity/ActivityLogTable";
import { fetchWhatsAppActivityLogs } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const [{ data: salesProfiles }, activities] = await Promise.all([
    db.from("profiles").select("full_name, role").in("role", ["sales", "admin"]).order("full_name"),
    fetchWhatsAppActivityLogs(db),
  ]);

  const salesUsers = Array.from(
    new Set([
      ...(salesProfiles ?? []).map((p) => p.full_name).filter(Boolean),
      ...activities.map((a) => a.sales_name).filter((n) => n !== "Unknown"),
    ])
  ).sort();

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader
          badge="Live"
          title="Activity Log"
          subtitle="WhatsApp clicks across the team"
        />
        <ActivityLogTable
          initialActivities={activities}
          salesUsers={salesUsers}
          showSalesUserFilter
          showSalesUserColumn
        />
      </div>
    </AppLayout>
  );
}
