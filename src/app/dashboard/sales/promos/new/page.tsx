import AppLayout from "@/components/layout/AppLayout";
import { PromoNewClient } from "@/components/promo/PromoNewClient";

export default function SalesNewPromoPage() {
  return (
    <AppLayout role="sales">
      <PromoNewClient basePath="/dashboard/sales/promos" isAdmin={false} />
    </AppLayout>
  );
}
