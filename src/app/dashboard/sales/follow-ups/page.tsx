import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FollowUpQueue } from "@/components/follow-up/FollowUpQueue";

export const dynamic = "force-dynamic";

export default async function SalesFollowUpsPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  return (
    <AppLayout role="sales">
      <div className="space-y-6">
        <PageHeader
          badge="My queue"
          title="Follow Up Queue"
          subtitle="Your assigned leads that need follow up after WhatsApp contact"
        />
        <FollowUpQueue role="sales" />
      </div>
    </AppLayout>
  );
}
