import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { AdminDashboardClient } from "./client";
import { getCachedAdminDashboard } from "@/lib/cache/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const { salesProfiles, performanceData, aggregateStats } =
    await getCachedAdminDashboard(db);

  return (
    <AppLayout role="admin">
      <AdminDashboardClient
        salesProfiles={salesProfiles}
        performanceData={performanceData}
        aggregateStats={aggregateStats}
      />
    </AppLayout>
  );
}
