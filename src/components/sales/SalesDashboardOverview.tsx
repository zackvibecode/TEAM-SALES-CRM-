"use client";

import { useEffect, useState } from "react";
import {
  List,
  Clock,
  MousePointerClick,
  TrendingUp,
  CalendarClock,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { DashboardMetricSection, DashboardMetricTile } from "@/components/shared/DashboardMetricTile";
import type { FollowUpKpiStats } from "@/lib/follow-up/types";

interface Stats {
  total: number;
  pending: number;
  clicked: number;
  todayClicks: number;
  weekClicks: number;
}

export function SalesDashboardOverview({ stats }: { stats: Stats }) {
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
      <DashboardMetricSection title="Follow ups" columns={3}>
        <DashboardMetricTile label="Follow Up Today" value={followUp?.today ?? "—"} icon={CalendarClock} accent="sky" />
        <DashboardMetricTile label="Overdue Follow Ups" value={followUp?.overdue ?? "—"} icon={AlertTriangle} accent="amber" />
        <DashboardMetricTile label="Total Follow Ups" value={followUp?.total ?? "—"} icon={ListChecks} accent="blue" />
      </DashboardMetricSection>

      <DashboardMetricSection title="Leads & WhatsApp clicks" columns={5}>
        <DashboardMetricTile label="Total Leads" value={stats.total} icon={List} accent="blue" highlight />
        <DashboardMetricTile label="Pending Leads" value={stats.pending} icon={Clock} accent="amber" />
        <DashboardMetricTile label="Total Clicked" value={stats.clicked} icon={MousePointerClick} accent="mint" />
        <DashboardMetricTile label="Today Clicks" value={stats.todayClicks} icon={TrendingUp} accent="sky" />
        <DashboardMetricTile label="This Week Clicks" value={stats.weekClicks} icon={TrendingUp} accent="blue" />
      </DashboardMetricSection>
    </div>
  );
}
