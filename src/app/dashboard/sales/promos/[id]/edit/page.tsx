import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { getPromoById } from "@/lib/promo/service";
import { PromoEditClient } from "@/components/promo/PromoEditClient";

export const dynamic = "force-dynamic";

export default async function SalesEditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const promo = await getPromoById(db, id);
  if (!promo) notFound();

  return (
    <AppLayout role="sales">
      <PromoEditClient promo={promo} basePath="/dashboard/sales/promos" isAdmin={false} />
    </AppLayout>
  );
}
