import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RotatorSubNav } from "@/components/rotator/RotatorSubNav";
import { RotatorSalesClient } from "./client";
import { createDbClient } from "@/lib/supabase/server";
import { getSalesClickStats } from "@/lib/rotator/analytics";

export const dynamic = "force-dynamic";

export default async function RotatorSalesPage() {
  const db = createDbClient();
  const { data: members, error: membersError } = await db
    .from("rotator_sales_members")
    .select("*")
    .order("rotation_order");

  if (membersError) {
    return (
      <AppLayout role="admin">
        <div className="dashboard-shell space-y-6">
          <PageHeader badge="Admin" title="Rotator Team" subtitle="Sales team" compact />
          <RotatorSubNav />
          <p className="text-sm text-red-600 card-padded">Gagal memuatkan sales team: {membersError.message}</p>
        </div>
      </AppLayout>
    );
  }

  let stats: Record<string, { total: number; unique: number; duplicate: number }> = {};
  try {
    stats = await getSalesClickStats(db, (members || []).map((m) => m.id));
  } catch {
    stats = {};
  }

  const enriched = (members || []).map((m) => ({
    ...m,
    total_assigned: stats[m.id]?.total || 0,
    unique_clicks: stats[m.id]?.unique || 0,
    duplicate_clicks: stats[m.id]?.duplicate || 0,
  }));

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader
          badge="Admin"
          title="Rotator Team"
          subtitle="Manage sales team for WhatsApp rotation"
          compact
        />
        <RotatorSubNav />
        <RotatorSalesClient initialMembers={enriched} />
      </div>
    </AppLayout>
  );
}
