import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { WhatsAppPretextEditor } from "@/components/settings/WhatsAppPretextEditor";
import { AdminResetData } from "@/components/admin/AdminResetData";
import { AdminAgentApiKeyPanel } from "@/components/admin/AdminAgentApiKeyPanel";

export default function AdminSettingsPage() {
  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader
          badge="Admin"
          title="Settings"
          subtitle="Workspace preferences and your WhatsApp opening message"
          compact
        />
        <AdminAgentApiKeyPanel />
        <WhatsAppPretextEditor />
        <AdminResetData variant="panel" />
      </div>
    </AppLayout>
  );
}
