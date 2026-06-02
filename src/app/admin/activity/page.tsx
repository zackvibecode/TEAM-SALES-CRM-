import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivityClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const { data: activities } = await db
    .from("lead_activities")
    .select("*, sales_user: sales_user_id (full_name, email), lead: lead_id (name, whatsapp)")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader badge="Live" title="Activity Log" subtitle="All sales activity across the team" />
        <ActivityClient
          initialActivities={(activities || []).map((a) => ({
            id: a.id,
            sales_name: (a.sales_user as { full_name: string })?.full_name || "Unknown",
            lead_name: (a.lead as { name: string })?.name || "Unknown",
            lead_whatsapp: (a.lead as { whatsapp: string })?.whatsapp || "",
            activity_type: a.activity_type,
            old_status: a.old_status,
            new_status: a.new_status,
            notes: a.notes,
            created_at: a.created_at,
          }))}
        />
      </div>
    </AppLayout>
  );
}
