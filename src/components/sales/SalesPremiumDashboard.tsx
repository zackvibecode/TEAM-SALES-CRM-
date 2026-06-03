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
  Sparkles,
} from "lucide-react";

interface Props {
  fullName: string;
  total: number;
  pending: number;
  clicked: number;
  todayClicks: number;
  converted: number;
  followUp: number;
  interested: number;
  notInt: number;
  noResp: number;
  batches: SalesBatchCard[];
  newBatchCount: number;
  kpiClicks: number | null;
  kpiConverts: number | null;
  monthClicks: number;
  monthConverts: number;
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
        <StatCard label="Total in book" value={props.total} icon={List} accent="blue" />
        <StatCard label="Pending queue" value={props.pending} icon={Clock} accent="amber" />
        <StatCard label="Clicked" value={props.clicked} icon={MousePointerClick} accent="sky" />
        <StatCard label="Today clicks" value={props.todayClicks} icon={TrendingUp} accent="blue" />
        <StatCard label="Converted" value={props.converted} icon={Sparkles} accent="mint" />
      </div>

      <SalesDashboardExtras
        batches={props.batches}
        newBatchCount={props.newBatchCount}
        kpiClicks={props.kpiClicks}
        kpiConverts={props.kpiConverts}
        monthClicks={props.monthClicks}
        monthConverts={props.monthConverts}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Follow Up", value: props.followUp },
          { label: "Interested", value: props.interested },
          { label: "Not Interested", value: props.notInt },
          { label: "No Response", value: props.noResp },
        ].map((s) => (
          <div key={s.label} className="glass-strong rounded-3xl px-4 py-4 text-center">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
