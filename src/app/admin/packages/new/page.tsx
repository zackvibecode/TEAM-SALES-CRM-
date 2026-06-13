import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PromoForm } from "@/components/promo/PromoForm";

export const dynamic = "force-dynamic";

export default async function AdminPackagesNewPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  return (
    <AppLayout role="admin">
      <PromoForm basePath="/admin/packages" />
    </AppLayout>
  );
}
