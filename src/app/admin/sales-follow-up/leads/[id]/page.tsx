import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { LeadDetailView } from "@/components/sales-follow-up/LeadDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SalesFollowUpLeadDetailPage({ params }: Props) {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { id } = await params;

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell">
        <LeadDetailView
          leadId={id}
          onBack={() => {}}
        />
      </div>
    </AppLayout>
  );
}
