import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FollowUpQueue } from "@/components/follow-up/FollowUpQueue";

export const dynamic = "force-dynamic";

export default async function AdminFollowUpsPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const { data: salesUsers } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("role", "sales")
    .order("full_name");

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader
          badge="Queue"
          title="Follow Up Queue"
          subtitle="Leads that need follow up after WhatsApp contact — all sales users"
        />
        <FollowUpQueue role="admin" salesUsers={salesUsers ?? []} />
      </div>
    </AppLayout>
  );
}
