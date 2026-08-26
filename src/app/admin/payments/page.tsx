import AppLayout from "@/components/layout/AppLayout";
import { AdminPaymentsClient } from "@/components/payment/AdminPaymentsClient";

export default function AdminPaymentsPage() {
  return (
    <AppLayout role="admin">
      <AdminPaymentsClient />
    </AppLayout>
  );
}
