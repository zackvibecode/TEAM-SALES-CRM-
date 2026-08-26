import AppLayout from "@/components/layout/AppLayout";
import { AdminPaymentSettingsClient } from "@/components/payment/AdminPaymentSettingsClient";

export default function AdminPaymentSettingsPage() {
  return (
    <AppLayout role="admin">
      <AdminPaymentSettingsClient />
    </AppLayout>
  );
}
