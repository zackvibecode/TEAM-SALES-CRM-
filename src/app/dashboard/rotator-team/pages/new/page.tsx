import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RotatorSubNav } from "@/components/rotator/RotatorSubNav";
import { RotatorPageForm } from "@/components/rotator/RotatorPageForm";
import { createDbClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewRotatorPage() {
  const db = createDbClient();
  const { data: salesMembers } = await db
    .from("rotator_sales_members")
    .select("*")
    .order("rotation_order");

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader badge="Admin" title="New Rotator Page" subtitle="Create a WhatsApp rotator landing page" compact />
        <RotatorSubNav />
        <RotatorPageForm salesMembers={salesMembers || []} />
      </div>
    </AppLayout>
  );
}
