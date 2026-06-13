"use client";

import { SalesPageShell } from "@/components/i18n/PageShells";
import { ActivityLogTable } from "@/components/activity/ActivityLogTable";
import type { ActivityLogItem } from "@/lib/activity-log";

export function SalesActivityShell({
  activities,
  subtitle,
}: {
  activities: ActivityLogItem[];
  subtitle: string;
}) {
  return (
    <SalesPageShell section="activity" subtitle={subtitle} className="space-y-6">
      <ActivityLogTable initialActivities={activities} showSalesUserColumn={false} />
    </SalesPageShell>
  );
}
