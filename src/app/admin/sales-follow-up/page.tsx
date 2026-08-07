import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesFollowUpDashboard } from "@/components/sales-follow-up/SalesFollowUpDashboard";

export const dynamic = "force-dynamic";

export default async function SalesFollowUpPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell">
        <SalesFollowUpDashboard />
      </div>
    </AppLayout>
  );
}
