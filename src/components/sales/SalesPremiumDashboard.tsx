"use client";

import Link from "next/link";
import { DailyGoalPanel } from "./DailyGoalPanel";
import { SalesDashboardExtras, type SalesBatchCard } from "./SalesDashboardExtras";
import { SalesDashboardOverview } from "./SalesDashboardOverview";
import { PageHeader } from "@/components/shared/PageHeader";
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
      <PageHeader
        greeting={greeting}
        title={props.fullName || "Sales"}
        subtitle="Your lead book is synced. Set today's follow-up target and work your queue."
        compact
        actions={
          <Link href="/dashboard/sales/customers" className="btn-primary-solid shrink-0 gap-2 text-sm">
            Open My Tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

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
