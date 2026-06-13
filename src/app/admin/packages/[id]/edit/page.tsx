import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PromoForm } from "@/components/promo/PromoForm";
import { getPromoById } from "@/lib/promo/service";
import type { Promo } from "@/types/promo";

export const dynamic = "force-dynamic";

export default async function AdminPackagesEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  let promo: Promo | null = null;
  try {
    promo = await getPromoById(db, id);
  } catch {
    promo = null;
  }

  if (!promo) {
    return (
      <AppLayout role="admin">
        <div className="p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Package not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin">
      <PromoForm promo={promo} basePath="/admin/packages" />
    </AppLayout>
  );
}
