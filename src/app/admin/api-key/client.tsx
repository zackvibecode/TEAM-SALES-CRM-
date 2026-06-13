"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AdminPageShell } from "@/components/i18n/PageShells";
import { AdminAgentApiKeyPanel } from "@/components/admin/AdminAgentApiKeyPanel";

export default function AdminApiKeyPageClient() {
  return (
    <AppLayout role="admin">
      <AdminPageShell section="apiKey" compact className="dashboard-shell">
        <AdminAgentApiKeyPanel />
      </AdminPageShell>
    </AppLayout>
  );
}
