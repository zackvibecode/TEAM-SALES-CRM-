"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AdminPageShell } from "@/components/i18n/PageShells";
import { WhatsAppPretextEditor } from "@/components/settings/WhatsAppPretextEditor";
import { AdminResetData } from "@/components/admin/AdminResetData";
import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

function SettingsContent() {
  const { t } = useAppLocale();

  return (
    <>
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
              {t.admin.apiKey.title}
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {t.admin.apiKey.subtitle}
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
    </>
  );
}

export default function AdminSettingsPageClient() {
  return (
    <AppLayout role="admin">
      <AdminPageShell section="settings" compact>
        <SettingsContent />
      </AdminPageShell>
    </AppLayout>
  );
}
