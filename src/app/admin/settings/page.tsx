import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { WhatsAppPretextEditor } from "@/components/settings/WhatsAppPretextEditor";
import Link from "next/link";
import { AdminResetData } from "@/components/admin/AdminResetData";
import { Bot, ArrowRight } from "lucide-react";

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
        <Link
          href="/admin/api-key"
          className="card-padded flex items-center justify-between gap-4 group hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="icon-stat w-10 h-10 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                AI Sales Monitor API
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                Jana API key untuk Hermes / Telegram bot
              </p>
            </div>
          </div>
          <ArrowRight
            className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-0.5"
            style={{ color: "var(--text-muted)" }}
          />
        </Link>
        <WhatsAppPretextEditor />
        <AdminResetData variant="panel" />
      </div>
    </AppLayout>
  );
}
