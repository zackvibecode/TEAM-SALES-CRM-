import AppLayout from "@/components/layout/AppLayout";
import { PromoNewClient } from "@/components/promo/PromoNewClient";

export default function AdminNewPromoPage() {
  return (
    <AppLayout role="admin">
      <PromoNewClient basePath="/admin/promos" isAdmin />
    </AppLayout>
  );
}
