import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminAgentApiKeyPanel } from "@/components/admin/AdminAgentApiKeyPanel";

export default function AdminApiKeyPage() {
  return (
    <AppLayout role="admin">
      <div className="dashboard-shell">
        <PageHeader
          badge="Admin"
          title="AI API Key"
          subtitle="Jana dan urus key untuk Hermes, Telegram bot, atau AI monitor sales team"
          compact
        />
        <AdminAgentApiKeyPanel />
      </div>
    </AppLayout>
  );
}
