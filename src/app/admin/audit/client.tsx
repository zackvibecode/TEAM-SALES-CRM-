"use client";

import AppLayout from "@/components/layout/AppLayout";
import { LocalizedAdminHeader } from "@/components/i18n/LocalizedPageHeader";
import { formatDateTime } from "@/lib/i18n/format";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  details: Record<string, unknown>;
  actor?: { full_name?: string } | null;
}

export function AdminAuditClient({ logs }: { logs: AuditLog[] }) {
  const { t, locale } = useAppLocale();

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <LocalizedAdminHeader section="audit" />
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="table-th">{t.common.time}</th>
                  <th className="table-th">{t.admin.audit.adminCol}</th>
                  <th className="table-th">{t.admin.audit.actionCol}</th>
                  <th className="table-th">{t.common.details}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="table-row">
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {formatDateTime(log.created_at, locale)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      {log.actor?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-md truncate" style={{ color: "var(--text-muted)" }}>
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                      {t.admin.audit.noEntries}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
