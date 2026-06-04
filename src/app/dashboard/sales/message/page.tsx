import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
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
      <div className="space-y-6">
        <PageHeader
          badge="WhatsApp"
          title="WhatsApp Message"
          subtitle="Set your default opening text for every WhatsApp contact from the CRM"
        />
        <WhatsAppPretextEditor />
      </div>
    </AppLayout>
  );
}
