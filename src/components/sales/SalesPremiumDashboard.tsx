"use client";

import Link from "next/link";
import { DailyGoalPanel } from "./DailyGoalPanel";
import { SalesDashboardExtras, type SalesBatchCard } from "./SalesDashboardExtras";
import { SalesDashboardOverview } from "./SalesDashboardOverview";
import { ArrowRight } from "lucide-react";

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
    <div className="dashboard-shell">
      <section className="page-hero page-hero--compact">
        <div className="page-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="page-hero-badge">Sales workspace</span>
            <h1 className="page-hero-title">
              {greeting}, {props.fullName || "Sales"}
            </h1>
            <p className="page-hero-subtitle">
              Your lead book is synced. Set today&apos;s follow-up target and work your queue.
            </p>
          </div>
          <Link href="/dashboard/sales/customers" className="btn-primary-solid shrink-0 gap-2 text-xs px-4 py-2">
            Open My Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <SalesDashboardOverview
        stats={{
          total: props.total,
          pending: props.pending,
          clicked: props.clicked,
          todayClicks: props.todayClicks,
          weekClicks: props.weekClicks,
        }}
      />

      <DailyGoalPanel />

      <SalesDashboardExtras
        batches={props.batches}
        newBatchCount={props.newBatchCount}
        kpiClicks={props.kpiClicks}
        monthClicks={props.monthClicks}
      />
    </div>
  );
}
