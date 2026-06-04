import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { WhatsAppPretextEditor } from "@/components/settings/WhatsAppPretextEditor";

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
        <WhatsAppPretextEditor />
      </div>
    </AppLayout>
  );
}
