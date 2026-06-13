import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { fetchWhatsAppActivityLogs } from "@/lib/activity-log";
import { SalesActivityShell } from "./shell";

export const dynamic = "force-dynamic";

export default async function SalesActivityPage() {
  const auth = await createServerSupabaseClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const activities = await fetchWhatsAppActivityLogs(db, { salesUserId: user.id });

  return (
    <AppLayout role="sales">
      <SalesActivityShell
        activities={activities}
        subtitle={`WhatsApp · ${profile?.full_name ?? user.email}`}
      />
    </AppLayout>
  );
}
