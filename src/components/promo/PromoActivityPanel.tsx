"use client";

import { useEffect, useState } from "react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { formatDateTime } from "@/lib/i18n/format";
import type { PromoActivityLog } from "@/types/promo";

interface PromoActivityPanelProps {
  promoId?: string;
  limit?: number;
}

export function PromoActivityPanel({ promoId, limit = 50 }: PromoActivityPanelProps) {
  const { t, locale } = useAppLocale();
  const [logs, setLogs] = useState<PromoActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({ limit: String(limit) });
      if (promoId) params.set("promo_id", promoId);
      const res = await fetch(`/api/promos/activity?${params}`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
      setLoading(false);
    }
    load();
  }, [promoId, limit]);

  const actionLabel = (action: string) => {
    if (action === "created") return t.promo.actionCreated;
    if (action === "updated") return t.promo.actionUpdated;
    if (action === "deleted") return t.promo.actionDeleted;
    return action;
  };

  if (loading) {
    return <div className="card-padded animate-pulse h-24 surface-card" />;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {t.promo.activityTitle}
        </h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t.promo.activitySubtitle}
        </p>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-th">{t.common.time}</th>
              <th className="table-th">{t.common.user}</th>
              <th className="table-th">{t.common.actions}</th>
              <th className="table-th">{t.common.details}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="px-4 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {formatDateTime(log.created_at, locale)}
                </td>
                <td className="px-4 py-2 text-xs" style={{ color: "var(--text-primary)" }}>
                  {(log.actor as { full_name?: string })?.full_name || "—"}
                </td>
                <td className="px-4 py-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {actionLabel(log.action)}
                </td>
                <td className="px-4 py-2 text-xs max-w-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {JSON.stringify(log.changes)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  {t.common.noData}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
