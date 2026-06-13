import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesCustomersShell } from "./shell";

export const dynamic = "force-dynamic";

export default async function SalesCustomersPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const [
    { count: totalCount, error: leadsError },
    { count: pendingCountExact, error: pendingError },
    { data: files, error: filesError },
    { data: profile, error: profileError },
    { data: roleFromRpc },
  ] = await Promise.all([
    auth
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", user.id),
    auth
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", user.id)
      .eq("status", "Pending"),
    auth
      .from("uploaded_files")
      .select("id, campaign_name, file_name, is_archived")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false }),
    auth.from("profiles").select("full_name, email, role, whatsapp_pretext").eq("id", user.id).single(),
    auth.rpc("get_user_role", { user_id: user.id }),
  ]);

  const effectiveRole = (profile?.role || roleFromRpc || "") as string;

  const batches = (files || [])
    .filter((f) => !(f.is_archived ?? false))
    .map((f) => ({
      id: f.id,
      label: f.campaign_name || f.file_name,
    }));

  const pendingCount = pendingCountExact ?? 0;
  const dbError = leadsError?.message || pendingError?.message || filesError?.message || profileError?.message;

  return (
    <AppLayout role="sales">
      <SalesCustomersShell
        fullName={profile?.full_name}
        email={profile?.email}
        batches={batches}
        whatsappPretext={profile?.whatsapp_pretext ?? null}
        totalCount={totalCount ?? 0}
        pendingCount={pendingCount}
        effectiveRole={effectiveRole}
        userEmail={profile?.email || user.email || ""}
        dbError={dbError}
      />
    </AppLayout>
  );
}
