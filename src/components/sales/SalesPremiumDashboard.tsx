"use client";

import Link from "next/link";
import { DailyGoalPanel } from "./DailyGoalPanel";
import { SalesDashboardExtras, type SalesBatchCard } from "./SalesDashboardExtras";
import { StatCard } from "@/components/shared/StatCard";
import { FollowUpKpiCards } from "@/components/follow-up/FollowUpKpiCards";
import {
  List,
  Clock,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface Props {
  fullName: string;
  total: number;
  pending: number;
  clicked: number;
  todayClicks: number;
  weekClicks: number;
  batches: SalesBatchCard[];
  newBatchCount: number;
  kpiClicks: number | null;
  monthClicks: number;
}

export function SalesPremiumDashboard(props: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <section className="page-hero">
        <div className="page-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="page-hero-badge">Sales workspace</span>
            <h1 className="page-hero-title">
              {greeting}, {props.fullName || "Sales"}
            </h1>
            <p className="page-hero-subtitle">
              Your lead book is synced. Set today&apos;s follow-up target and work your queue.
            </p>
          </div>
          <Link href="/dashboard/sales/customers" className="btn-primary-solid shrink-0 gap-2">
            Open My Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <FollowUpKpiCards compact />

      <DailyGoalPanel />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Leads" value={props.total} icon={List} accent="blue" />
        <StatCard label="Pending Leads" value={props.pending} icon={Clock} accent="amber" />
        <StatCard label="Total Clicked" value={props.clicked} icon={MousePointerClick} accent="sky" />
        <StatCard label="Today Clicks" value={props.todayClicks} icon={TrendingUp} accent="blue" />
        <StatCard label="This Week Clicks" value={props.weekClicks} icon={TrendingUp} accent="sky" />
      </div>

      <SalesDashboardExtras
        batches={props.batches}
        newBatchCount={props.newBatchCount}
        kpiClicks={props.kpiClicks}
        monthClicks={props.monthClicks}
      />
    </div>
  );
}
