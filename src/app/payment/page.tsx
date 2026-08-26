import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth-context";
import { createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PaymentPageClient } from "@/components/payment/PaymentPageClient";

export default async function PaymentPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const role = (await resolveUserRole(db, user.id)) ?? "sales";

  return (
    <AppLayout role={role}>
      <PaymentPageClient role={role} />
    </AppLayout>
  );
}
