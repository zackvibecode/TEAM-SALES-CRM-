import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminDashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - now.getDay());
  const weekStart = weekStartDate.toISOString();

  const [
    { count: salesUsers },
    { count: files },
    { count: leads },
    { count: clicked },
    { count: pending },
    { count: clicksToday },
    { count: clicksWeek },
    { data: salesProfiles },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "sales"),
    db.from("uploaded_files").select("*", { count: "exact", head: true }),
    db.from("leads").select("*", { count: "exact", head: true }),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "Clicked"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "Clicked").gte("clicked_at", todayStart),
    db.from("leads").select("*", { count: "exact", head: true }).eq("status", "Clicked").gte("clicked_at", weekStart),
    db.from("profiles").select("id, full_name, email").eq("role", "sales"),
  ]);

  // Pre-compute per-user stats
  const performanceData = salesProfiles
    ? await Promise.all(
        salesProfiles.map(async (sp) => {
          const [{ count: total }, { count: spClicked }, { count: spPending }, { count: today }, { count: week },
            { count: followUp }, { count: interested }, { count: notInt }, { count: noResp }, { count: converted }] =
            await Promise.all([
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Clicked"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Pending"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Clicked").gte("clicked_at", todayStart),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Clicked").gte("clicked_at", weekStart),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Follow Up"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Interested"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Not Interested"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "No Response"),
              db.from("leads").select("*", { count: "exact", head: true }).eq("owner_user_id", sp.id).eq("status", "Converted"),
            ]);
          return {
            id: sp.id,
            full_name: sp.full_name,
            email: sp.email,
            total_data: total ?? 0,
            clicked: spClicked ?? 0,
            pending: spPending ?? 0,
            followUp: followUp ?? 0,
            interested: interested ?? 0,
            notInterested: notInt ?? 0,
            noResponse: noResp ?? 0,
            converted: converted ?? 0,
            today_clicks: today ?? 0,
            this_week_clicks: week ?? 0,
            progress: (total ?? 0) > 0 ? Math.round(((spClicked ?? 0) / (total ?? 1)) * 100) : 0,
          };
        })
      )
    : [];

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader
          badge="Admin"
          title="Admin Dashboard"
          subtitle="Overview of all sales activity — live KPIs and team performance"
        />

        <AdminDashboardClient
          salesProfiles={salesProfiles || []}
          performanceData={performanceData}
          aggregateStats={{
            salesUsers: salesUsers ?? 0,
            files: files ?? 0,
            leads: leads ?? 0,
            clicked: clicked ?? 0,
            pending: pending ?? 0,
            clicksToday: clicksToday ?? 0,
            clicksWeek: clicksWeek ?? 0,
          }}
        />
      </div>
    </AppLayout>
  );
}
