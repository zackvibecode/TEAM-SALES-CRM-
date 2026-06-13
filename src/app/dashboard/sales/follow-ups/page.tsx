import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesPageShell } from "@/components/i18n/PageShells";
import { FollowUpQueue } from "@/components/follow-up/FollowUpQueue";

export const dynamic = "force-dynamic";

export default async function SalesFollowUpsPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await auth
    .from("profiles")
    .select("whatsapp_pretext")
    .eq("id", user.id)
    .single();

  return (
    <AppLayout role="sales">
      <SalesPageShell section="followUps" className="space-y-6">
        <FollowUpQueue role="sales" whatsappPretext={profile?.whatsapp_pretext ?? null} />
      </SalesPageShell>
    </AppLayout>
  );
}
