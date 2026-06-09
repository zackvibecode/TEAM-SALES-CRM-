import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivityLogTable } from "@/components/activity/ActivityLogTable";
import { fetchWhatsAppActivityLogs } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export default async function SalesActivityPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const activities = await fetchWhatsAppActivityLogs(db, { salesUserId: user.id });

  return (
    <AppLayout role="sales">
      <div className="space-y-6">
        <PageHeader
          badge="Live"
          title="My Activity Log"
          subtitle={`WhatsApp clicks · ${profile?.full_name ?? user.email}`}
        />
        <ActivityLogTable
          initialActivities={activities}
          showSalesUserColumn={false}
        />
      </div>
    </AppLayout>
  );
}
