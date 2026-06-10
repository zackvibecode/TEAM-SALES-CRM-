"use client";

import { useState } from "react";
import { AlertTriangle, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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
  const [view, setView] = useState<View>("clicks");

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Live"
        title="Activity Log"
        subtitle={
          view === "clicks"
            ? "WhatsApp clicks across the team"
            : "Rate limit warnings — users reminded to slow down"
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
              WhatsApp clicks
            </button>
            <button
              type="button"
              onClick={() => setView("warnings")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === "warnings" ? "btn-primary-solid" : "btn-secondary"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Rate limit warnings
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
