import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { LeadDetailClient } from "./client";

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
        <LeadDetailClient leadId={id} />
      </div>
    </AppLayout>
  );
}
