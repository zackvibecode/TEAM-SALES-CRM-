import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { AdminPageShell } from "@/components/i18n/PageShells";
import { UploadClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const [{ data: salesUsers }, { data: profile }] = await Promise.all([
    db.from("profiles").select("id, full_name, email").eq("role", "sales").order("full_name"),
    auth.from("profiles").select("whatsapp_pretext").eq("id", user.id).single(),
  ]);

  return (
    <AppLayout role="admin">
      <AdminPageShell section="upload" className="space-y-6">
        <UploadClient
          salesUsers={salesUsers || []}
          whatsappPretext={profile?.whatsapp_pretext ?? null}
        />
      </AdminPageShell>
    </AppLayout>
  );
}
