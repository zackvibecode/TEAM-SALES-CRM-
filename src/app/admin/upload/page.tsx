import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { UploadClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const { data: salesUsers } = await db
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "sales")
    .order("full_name");

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader
          badge="Campaigns"
          title="Upload File"
          subtitle="Assign campaigns to sales users — single or round-robin split"
        />
        <UploadClient salesUsers={salesUsers || []} />
      </div>
    </AppLayout>
  );
}
