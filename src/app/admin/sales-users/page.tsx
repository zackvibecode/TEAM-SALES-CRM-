import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { SalesUsersClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminSalesUsersPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const { data: salesUsers } = await db
    .from("profiles")
    .select("id, email, full_name, role, created_at, kpi_monthly_clicks, kpi_monthly_converts")
    .eq("role", "sales")
    .order("created_at", { ascending: false });

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader badge="Team" title="Sales Users" subtitle="Manage sales team members and monthly KPI targets" />
        <SalesUsersClient initialUsers={salesUsers || []} />
      </div>
    </AppLayout>
  );
}
