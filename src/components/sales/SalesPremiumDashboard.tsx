"use client";

import Link from "next/link";
import { DailyGoalPanel } from "./DailyGoalPanel";
import { SalesDashboardExtras, type SalesBatchCard } from "./SalesDashboardExtras";
import { SalesDashboardOverview } from "./SalesDashboardOverview";
import { PageHeader } from "@/components/shared/PageHeader";
import { TeamLeaderboard } from "@/components/shared/TeamLeaderboard";
import { ActivePackagesButton } from "@/components/promo/ActivePackagesButton";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { ArrowRight } from "lucide-react";

interface Props {
  fullName: string;
  currentUserId: string;
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
  const { t, locale } = useAppLocale();
  const hour = new Date().getHours();
  const greeting =
    locale === "bm"
      ? hour < 12
        ? "Selamat pagi"
        : hour < 17
          ? "Selamat petang"
          : "Selamat malam"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

  return (
    <div className="dashboard-shell space-y-5">
      <PageHeader
        greeting={greeting}
        title={props.fullName || t.sales.dashboard.badge}
        subtitle={t.sales.dashboard.subtitle}
        compact
        actions={
          <>
            <ActivePackagesButton href="/dashboard/sales/promos" />
            <Link href="/dashboard/sales/customers" className="btn-primary-solid shrink-0 gap-2 text-sm">
              {t.nav.myTasks}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        <DailyGoalPanel />
        <TeamLeaderboard currentUserId={props.currentUserId} />
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
