import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesPageShell } from "@/components/i18n/PageShells";
import { WhatsAppPretextEditor } from "@/components/settings/WhatsAppPretextEditor";

export const dynamic = "force-dynamic";

export default async function SalesWhatsAppMessagePage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  return (
    <AppLayout role="sales">
      <SalesPageShell section="message" className="space-y-6">
        <WhatsAppPretextEditor />
      </SalesPageShell>
    </AppLayout>
  );
}
