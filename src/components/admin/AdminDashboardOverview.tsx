"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  LayoutDashboard,
} from "lucide-react";
import {
  DashboardMetricPanel,
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

export function AdminDashboardOverview({
  stats,
  showWorkspace,
  viewingLabel,
  filterSlot,
}: {
  stats: Stats;
  showWorkspace?: boolean;
  viewingLabel?: string;
  filterSlot?: ReactNode;
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
    <DashboardMetricPanel
      title="Overview"
      subtitle={viewingLabel}
      icon={LayoutDashboard}
      action={filterSlot}
    >
      <div className="space-y-4">
        <DashboardMetricSection columns={4}>
          <DashboardMetricTile
            label="Total Leads"
            value={stats.leads}
            icon={List}
            accent="brand"
            highlight
          />
          <DashboardMetricTile
            label="Pending Leads"
            value={stats.pending}
            icon={Clock}
            accent="warning"
          />
          <DashboardMetricTile
            label="Total Clicked"
            value={stats.clicked}
            icon={MousePointerClick}
            accent="success"
          />
          <DashboardMetricTile
            label="Today Clicks"
            value={stats.clicksToday}
            icon={TrendingUp}
            accent="info"
          />
        </DashboardMetricSection>

        <DashboardMetricSection columns={4}>
          <DashboardMetricTile
            label="This Week Clicks"
            value={stats.clicksWeek}
            icon={TrendingUp}
            accent="brand"
          />
          <DashboardMetricTile
            label="Follow Up Today"
            value={followUp?.today ?? "—"}
            icon={CalendarClock}
            accent="info"
          />
          <DashboardMetricTile
            label="Overdue Follow Ups"
            value={followUp?.overdue ?? "—"}
            icon={AlertTriangle}
            accent="error"
          />
          <DashboardMetricTile
            label="Total Follow Ups"
            value={followUp?.total ?? "—"}
            icon={ListChecks}
            accent="brand"
          />
        </DashboardMetricSection>

        {showWorkspace && (
          <DashboardMetricSection columns={2}>
            <DashboardMetricTile
              label="Team Members"
              value={stats.salesUsers}
              icon={Users}
              accent="info"
            />
            <DashboardMetricTile
              label="Uploaded Files"
              value={stats.files}
              icon={FileText}
              accent="brand"
            />
          </DashboardMetricSection>
        )}
      </div>
    </DashboardMetricPanel>
  );
}
