"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  List,
  MousePointerClick,
  Clock,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { DashboardMetricSection, DashboardMetricTile } from "@/components/shared/DashboardMetricTile";
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

export function AdminDashboardOverview({
  stats,
  showWorkspace,
}: {
  stats: Stats;
  showWorkspace?: boolean;
  viewingLabel?: string;
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
    <div className="space-y-5">
      <DashboardMetricSection title="Key metrics" columns={5}>
        <DashboardMetricTile label="Total Leads" value={stats.leads} icon={List} accent="blue" highlight />
        <DashboardMetricTile label="Pending Leads" value={stats.pending} icon={Clock} accent="amber" />
        <DashboardMetricTile label="Total Clicked" value={stats.clicked} icon={MousePointerClick} accent="mint" />
        <DashboardMetricTile label="Today Clicks" value={stats.clicksToday} icon={TrendingUp} accent="sky" />
        <DashboardMetricTile label="This Week Clicks" value={stats.clicksWeek} icon={TrendingUp} accent="blue" />
      </DashboardMetricSection>

      <DashboardMetricSection title="Follow ups" columns={3}>
        <DashboardMetricTile label="Follow Up Today" value={followUp?.today ?? "—"} icon={CalendarClock} accent="sky" />
        <DashboardMetricTile label="Overdue Follow Ups" value={followUp?.overdue ?? "—"} icon={AlertTriangle} accent="amber" />
        <DashboardMetricTile label="Total Follow Ups" value={followUp?.total ?? "—"} icon={ListChecks} accent="blue" />
      </DashboardMetricSection>

      {showWorkspace && (
        <DashboardMetricSection title="Workspace" columns={3}>
          <DashboardMetricTile label="Sales Users" value={stats.salesUsers} icon={Users} accent="sky" />
          <DashboardMetricTile label="Uploaded Files" value={stats.files} icon={FileText} accent="blue" />
        </DashboardMetricSection>
      )}
    </div>
  );
}
