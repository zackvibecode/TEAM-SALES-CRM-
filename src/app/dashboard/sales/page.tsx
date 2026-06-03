import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesPremiumDashboard } from "@/components/sales/SalesPremiumDashboard";
import { computeBatchStats } from "@/lib/campaign-stats";

export const dynamic = "force-dynamic";

export default async function SalesDashboardPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total },
    { count: pending },
    { count: clicked },
    { count: todayClicks },
    { count: weekClicks },
    { count: monthClicks },
    { data: profile },
    { data: files },
    { data: fileLeads },
    { count: newBatches },
  ] = await Promise.all([
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id),
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("status", "Pending"),
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("status", "Clicked"),
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("status", "Clicked").gte("clicked_at", todayStart),
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("status", "Clicked").gte("clicked_at", sevenDaysAgo),
    auth.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).eq("status", "Clicked").gte("clicked_at", monthStart),
    auth.from("profiles").select("full_name, kpi_monthly_clicks").eq("id", user.id).single(),
    auth.from("uploaded_files").select("id, campaign_name, file_name, source_tag, is_archived, created_at").eq("owner_user_id", user.id).order("created_at", { ascending: false }),
    auth.from("leads").select("source_file_id, status").eq("owner_user_id", user.id),
    auth.from("uploaded_files").select("*", { count: "exact", head: true }).eq("owner_user_id", user.id).gte("created_at", sevenDaysAgo),
  ]);

  const statsByFile = new Map<string, { status: string }[]>();
  for (const row of fileLeads || []) {
    if (!row.source_file_id) continue;
    const list = statsByFile.get(row.source_file_id) || [];
    list.push({ status: row.status });
    statsByFile.set(row.source_file_id, list);
  }

  const batchCards = (files || [])
    .filter((f) => !(f.is_archived ?? false))
    .map((f) => {
      const stats = computeBatchStats(statsByFile.get(f.id) || []);
      return {
        id: f.id,
        label: f.campaign_name || f.file_name,
        source_tag: f.source_tag ?? null,
        total: stats.total,
        pending: stats.pending,
        progress: stats.progress,
        created_at: f.created_at,
      };
    });

  return (
    <AppLayout role="sales">
      <SalesPremiumDashboard
        fullName={profile?.full_name || "Sales User"}
        total={total ?? 0}
        pending={pending ?? 0}
        clicked={clicked ?? 0}
        todayClicks={todayClicks ?? 0}
        weekClicks={weekClicks ?? 0}
        batches={batchCards}
        newBatchCount={newBatches ?? 0}
        kpiClicks={profile?.kpi_monthly_clicks ?? null}
        monthClicks={monthClicks ?? 0}
      />
    </AppLayout>
  );
}
