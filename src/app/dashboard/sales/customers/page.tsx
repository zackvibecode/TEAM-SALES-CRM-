import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DailyGoalPanel } from "@/components/sales/DailyGoalPanel";
import { CustomersClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SalesCustomersPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const [
    { count: totalCount, error: leadsError },
    { count: pendingCountExact, error: pendingError },
    { data: files, error: filesError },
    { data: profile, error: profileError },
    { data: roleFromRpc },
  ] = await Promise.all([
    auth
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", user.id),
    auth
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", user.id)
      .eq("status", "Pending"),
    auth
      .from("uploaded_files")
      .select("id, campaign_name, file_name, is_archived")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false }),
    auth.from("profiles").select("full_name, email, role, whatsapp_pretext").eq("id", user.id).single(),
    auth.rpc("get_user_role", { user_id: user.id }),
  ]);

  const effectiveRole = (profile?.role || roleFromRpc || "") as string;

  const batches = (files || [])
    .filter((f) => !(f.is_archived ?? false))
    .map((f) => ({
      id: f.id,
      label: f.campaign_name || f.file_name,
    }));

  const pendingCount = pendingCountExact ?? 0;
  const dbError = leadsError?.message || pendingError?.message || filesError?.message || profileError?.message;

  return (
    <AppLayout role="sales">
      <div className="space-y-6">
        <PageHeader
          badge="Queue"
          title="My Tasks"
          subtitle={`${profile?.full_name} · ${profile?.email}`}
        />

        {dbError && (
          <div className="alert-error">
            Cannot load your leads: {dbError}. Ask admin to run{" "}
            <code className="text-xs">supabase-migrations/003_fix_rls_recursion.sql</code>
          </div>
        )}

        {!dbError && effectiveRole !== "sales" && (
          <div className="alert-error">
            Account role is &quot;{effectiveRole || "empty"}&quot;, not sales. Run migration 003 or set role=sales in Supabase profiles for {user.email}.
          </div>
        )}

        <DailyGoalPanel />

        <CustomersClient
          initialLeads={[]}
          batches={batches}
          pendingCount={pendingCount}
          totalCount={totalCount ?? 0}
          userEmail={profile?.email || user.email || ""}
          whatsappPretext={profile?.whatsapp_pretext ?? null}
        />
      </div>
    </AppLayout>
  );
}
