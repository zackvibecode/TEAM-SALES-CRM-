"use client";

import { useState } from "react";
import { AlertTriangle, Activity } from "lucide-react";
import { LocalizedAdminHeader } from "@/components/i18n/LocalizedPageHeader";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { ActivityLogTable } from "@/components/activity/ActivityLogTable";
import { WhatsAppWarningLogTable } from "@/components/activity/WhatsAppWarningLogTable";
import type { ActivityLogItem, WhatsAppWarningLogItem } from "@/lib/activity-log";

type View = "clicks" | "warnings";

export function AdminActivityView({
  activities,
  warnings,
  salesUsers,
}: {
  activities: ActivityLogItem[];
  warnings: WhatsAppWarningLogItem[];
  salesUsers: string[];
}) {
  const { t } = useAppLocale();
  const [view, setView] = useState<View>("clicks");

  return (
    <div className="space-y-6">
      <LocalizedAdminHeader
        section="activity"
        subtitle={
          view === "clicks"
            ? t.admin.activity.subtitle
            : t.activity.rateLimitWarning
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => setView("clicks")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === "clicks" ? "btn-primary-solid" : "btn-secondary"
              }`}
            >
              <Activity className="w-4 h-4" />
              {t.activity.filterWhatsapp}
            </button>
            <button
              type="button"
              onClick={() => setView("warnings")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === "warnings" ? "btn-primary-solid" : "btn-secondary"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {t.activity.rateLimitWarning}
              {warnings.length > 0 && (
                <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {warnings.length > 99 ? "99+" : warnings.length}
                </span>
              )}
            </button>
          </>
        }
      />

      {view === "clicks" ? (
        <ActivityLogTable
          initialActivities={activities}
          salesUsers={salesUsers}
          showSalesUserFilter
          showSalesUserColumn
        />
      ) : (
        <WhatsAppWarningLogTable initialWarnings={warnings} salesUsers={salesUsers} />
      )}
    </div>
  );
}
