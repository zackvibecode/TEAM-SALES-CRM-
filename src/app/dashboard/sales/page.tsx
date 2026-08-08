import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesPremiumDashboard } from "@/components/sales/SalesPremiumDashboard";
import { getCachedSalesDashboard } from "@/lib/cache/sales-dashboard";

export const revalidate = 60;

export default async function SalesDashboardPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const d = await getCachedSalesDashboard(auth, user.id);

  return (
    <AppLayout role="sales">
      <SalesPremiumDashboard
        fullName={d.fullName}
        currentUserId={user.id}
        total={d.total}
        pending={d.pending}
        clicked={d.clicked}
        todayClicks={d.todayClicks}
        weekClicks={d.weekClicks}
        batches={d.batchCards}
        newBatchCount={d.newBatchCount}
        kpiClicks={d.kpiClicks}
        monthClicks={d.monthClicks}
      />
    </AppLayout>
  );
}
