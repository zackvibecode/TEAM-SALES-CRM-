import AppLayout from "@/components/layout/AppLayout";
import { RotatorPageShell } from "@/components/i18n/PageShells";
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
      <RotatorPageShell subtitle={undefined}>
        <RotatorSubNav />
        <RotatorPageForm salesMembers={salesMembers || []} />
      </RotatorPageShell>
    </AppLayout>
  );
}
