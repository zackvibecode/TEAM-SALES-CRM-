"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, List, MousePointerClick, Clock } from "lucide-react";
import {
  DashboardMetricSection,
  DashboardMetricTile,
} from "@/components/shared/DashboardMetricTile";
import type { FollowUpKpiStats } from "@/lib/follow-up/types";

interface Stats {
  salesUsers: number;
  files: number;
  leads: number;
  clicked: number;
  pending: number;
  clicksToday: number;
  clicksWeek: number;
}

export function AdminDashboardOverview({ stats }: {
  stats: Stats;
  showWorkspace?: boolean;
  viewingLabel?: string;
  filterSlot?: React.ReactNode;
}) {
  const [followUp, setFollowUp] = useState<FollowUpKpiStats | null>(null);

  useEffect(() => {
    fetch("/api/follow-ups/kpi", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.kpis) setFollowUp(d.kpis);
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardMetricSection columns={4}>
      <DashboardMetricTile
        label="Total Leads"
        value={stats.leads}
        icon={List}
        accent="brand"
        highlight
      />
      <DashboardMetricTile
        label="Pending"
        value={stats.pending}
        icon={Clock}
        accent="warning"
      />
      <DashboardMetricTile
        label="Clicks Today"
        value={stats.clicksToday}
        icon={MousePointerClick}
        accent="info"
      />
      <DashboardMetricTile
        label="Overdue Follow-Ups"
        value={followUp?.overdue ?? "—"}
        icon={AlertTriangle}
        accent="error"
      />
    </DashboardMetricSection>
  );
}
