import { Suspense } from "react";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { AdminPageShell } from "@/components/i18n/PageShells";
import { AllLeadsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminAllLeadsPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const [{ data: leads }, { data: salesUsers }, { data: files }, { data: profile }] = await Promise.all([
    db
      .from("leads")
      .select("*, owner:owner_user_id (full_name, email)")
      .order("created_at", { ascending: false })
      .limit(2000),
    db.from("profiles").select("id, full_name").eq("role", "sales").order("full_name"),
    db.from("uploaded_files").select("id, campaign_name, file_name").order("created_at", { ascending: false }),
    auth.from("profiles").select("whatsapp_pretext").eq("id", user.id).single(),
  ]);

  const batches = (files || []).map((f) => ({
    id: f.id,
    label: f.campaign_name || f.file_name,
  }));

  return (
    <AppLayout role="admin">
      <AdminPageShell section="leads" className="space-y-6">
        <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
          <AllLeadsClient
            salesUsers={salesUsers || []}
            batches={batches}
            whatsappPretext={profile?.whatsapp_pretext ?? null}
            initialLeads={(leads || []).map((l) => ({
              id: l.id,
              owner_id: l.owner_user_id,
              owner_name: (l.owner as { full_name: string })?.full_name || "Unknown",
              source_file_id: l.source_file_id,
              name: l.name,
              whatsapp: l.whatsapp,
              package_interest: l.package_interest,
              status: l.status,
              notes: l.notes,
              created_at: l.created_at,
            }))}
          />
        </Suspense>
      </AdminPageShell>
    </AppLayout>
  );
}
