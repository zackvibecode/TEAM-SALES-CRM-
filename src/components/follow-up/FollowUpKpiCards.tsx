"use client";

import { useEffect, useState } from "react";
import { DashboardMetricSection, DashboardMetricTile } from "@/components/shared/DashboardMetricTile";
import { CalendarClock, AlertTriangle, ListChecks } from "lucide-react";
import type { FollowUpKpiStats } from "@/lib/follow-up/types";

export function FollowUpKpiCards({ compact }: { compact?: boolean }) {
  const [kpis, setKpis] = useState<FollowUpKpiStats | null>(null);

  useEffect(() => {
    fetch("/api/follow-ups/kpi", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.kpis) setKpis(d.kpis);
      })
      .catch(() => {});
  }, []);

  if (!kpis) return null;

  return (
    <DashboardMetricSection title={compact ? undefined : "Follow ups"} columns={3}>
      <DashboardMetricTile label="Follow Up Today" value={kpis.today} icon={CalendarClock} accent="sky" />
      <DashboardMetricTile label="Overdue" value={kpis.overdue} icon={AlertTriangle} accent="amber" />
      <DashboardMetricTile label="Total Follow Ups" value={kpis.total} icon={ListChecks} accent="blue" />
    </DashboardMetricSection>
  );
}
