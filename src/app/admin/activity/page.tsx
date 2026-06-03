import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivityClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const [{ data: legacy }, { data: rich }] = await Promise.all([
    db
      .from("lead_activities")
      .select("*, sales_user: sales_user_id (full_name, email), lead: lead_id (name, whatsapp)")
      .order("created_at", { ascending: false })
      .limit(300),
    db
      .from("activity_logs")
      .select("*, lead: lead_id (name, whatsapp)")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const legacyItems = (legacy || []).map((a) => ({
    id: `legacy-${a.id}`,
    sales_name: (a.sales_user as { full_name: string })?.full_name || "Unknown",
    lead_name: (a.lead as { name: string })?.name || "Unknown",
    lead_whatsapp: (a.lead as { whatsapp: string })?.whatsapp || "",
    activity_type: a.activity_type,
    message: a.notes || `${a.old_status ?? ""} → ${a.new_status ?? ""}`.trim(),
    old_status: a.old_status,
    new_status: a.new_status,
    notes: a.notes,
    created_at: a.created_at,
  }));

  const richItems = (rich || []).map((a) => ({
    id: a.id,
    sales_name: a.sales_user_name || "Unknown",
    lead_name: (a.lead as { name: string })?.name || "Unknown",
    lead_whatsapp: (a.lead as { whatsapp: string })?.whatsapp || "",
    activity_type: a.action_type,
    message: a.message,
    old_status: null as string | null,
    new_status: null as string | null,
    notes: null as string | null,
    created_at: a.created_at,
  }));

  const merged = [...richItems, ...legacyItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader
          badge="Live"
          title="Activity Log"
          subtitle="WhatsApp clicks, follow ups, and status changes across the team"
        />
        <ActivityClient initialActivities={merged.slice(0, 500)} />
      </div>
    </AppLayout>
  );
}
