import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PromosPageClient } from "@/components/promo/PromosPageClient";
import { listPromos } from "@/lib/promo/service";
import type { Promo } from "@/types/promo";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  let promos: Promo[] = [];
  try {
    promos = await listPromos(db);
  } catch {
    promos = [];
  }

  return (
    <AppLayout role="admin">
      <PromosPageClient
        promos={promos}
        currentUserId={user.id}
        isAdmin
        basePath="/admin/promos"
      />
    </AppLayout>
  );
}
