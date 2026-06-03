import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <AppLayout role="admin">
      <div className="dashboard-shell">
        <PageHeader
          badge="Admin"
          title="Settings"
          subtitle="Workspace preferences and configuration"
          compact
        />
        <div className="card-padded-sm text-center py-16">
          <div className="icon-stat mx-auto mb-4 w-12 h-12">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Settings coming soon
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            This page is a placeholder for future admin settings. All CRM features continue to work as before.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
