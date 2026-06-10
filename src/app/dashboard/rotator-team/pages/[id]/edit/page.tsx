import { notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RotatorSubNav } from "@/components/rotator/RotatorSubNav";
import { RotatorPageForm } from "@/components/rotator/RotatorPageForm";
import { createDbClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditRotatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createDbClient();

  const [{ data: page }, { data: salesMembers }, { data: assignments }] = await Promise.all([
    db.from("rotator_pages").select("*").eq("id", id).maybeSingle(),
    db.from("rotator_sales_members").select("*").order("rotation_order"),
    db.from("rotator_page_sales").select("sales_member_id").eq("rotator_page_id", id),
  ]);

  if (!page) notFound();

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader badge="Admin" title="Edit Rotator Page" subtitle={page.name} compact />
        <RotatorSubNav />
        <RotatorPageForm
          page={page}
          salesMembers={salesMembers || []}
          assignedIds={(assignments || []).map((a) => a.sales_member_id)}
        />
      </div>
    </AppLayout>
  );
}
