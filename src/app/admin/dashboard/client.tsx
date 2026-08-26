"use client";

import { useState, useMemo } from "react";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { AdminPerformanceGraph } from "@/components/admin/AdminPerformanceGraph";
import { DashboardTable } from "@/components/shared/DashboardTable";
import { TeamLeaderboard } from "@/components/shared/TeamLeaderboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { ActivePackagesButton } from "@/components/promo/ActivePackagesButton";
import { DashboardSubscriptionBanner } from "@/components/payment/DashboardSubscriptionBanner";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface SalesProfile {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

interface PerformanceRow {
  id: string;
  full_name: string;
  email: string;
  total_data: number;
  clicked: number;
  pending: number;
  followUp: number;
  interested: number;
  notInterested: number;
  noResponse: number;
  converted: number;
  today_clicks: number;
  this_week_clicks: number;
  progress: number;
}

interface AggregateStats {
  salesUsers: number;
  files: number;
  leads: number;
  clicked: number;
  pending: number;
  clicksToday: number;
  clicksWeek: number;
}

interface Props {
  salesProfiles: SalesProfile[];
  performanceData: PerformanceRow[];
  aggregateStats: AggregateStats;
}

export function AdminDashboardClient({ salesProfiles, performanceData, aggregateStats }: Props) {
  const { t } = useAppLocale();
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const currentStats = useMemo(() => {
    if (selectedUserId === "all") return aggregateStats;
    const row = performanceData.find((p) => p.id === selectedUserId);
    if (!row) return aggregateStats;
    return {
      salesUsers: 1,
      files: 0,
      leads: row.total_data,
      clicked: row.clicked,
      pending: row.pending,
      clicksToday: row.today_clicks,
      clicksWeek: row.this_week_clicks,
    };
  }, [selectedUserId, aggregateStats, performanceData]);

  const filteredPerformance = useMemo(() => {
    if (selectedUserId === "all") return performanceData;
    return performanceData.filter((p) => p.id === selectedUserId);
  }, [selectedUserId, performanceData]);

  const selectedUserName = selectedUserId === "all"
    ? "All Users"
    : salesProfiles.find((s) => s.id === selectedUserId)?.full_name || "Unknown";

  return (
    <div className="dashboard-shell space-y-6">
      <PageHeader
        badge={t.admin.dashboard.badge}
        title={t.admin.dashboard.title}
        subtitle={t.admin.dashboard.subtitle}
        compact
        actions={<ActivePackagesButton href="/admin/promos" />}
      />

      <DashboardSubscriptionBanner />

      <AdminDashboardOverview
        stats={currentStats}
        showWorkspace={selectedUserId === "all"}
        viewingLabel={
          selectedUserId === "all"
            ? "Team-wide metrics"
            : `Metrics for ${selectedUserName}`
        }
        filterSlot={
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="input-field max-w-xs py-2 text-sm"
            aria-label="View team user"
          >
            <option value="all">All Users</option>
            {salesProfiles.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.full_name}{sp.role === "admin" ? " (Admin)" : ""}
              </option>
            ))}
          </select>
        }
      />

      {selectedUserId === "all" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 min-h-0 flex">
            <AdminPerformanceGraph />
          </div>
          <div className="min-h-0 flex w-full">
            <TeamLeaderboard />
          </div>
        </div>
      ) : (
        <AdminPerformanceGraph />
      )}

      <DashboardTable title={`Team Performance — ${selectedUserName}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th text-right">Total</th>
              <th className="table-th text-right">Clicked</th>
              <th className="table-th text-right">Pending</th>
              <th className="table-th text-right">Today</th>
              <th className="table-th text-right">Week</th>
              <th className="table-th text-center">Progress</th>
            </tr>
          </thead>
          <tbody>
            {filteredPerformance.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="px-4 py-4 font-medium" style={{ color: "var(--text-primary)" }}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: "var(--surface-muted)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {p.full_name.charAt(0).toUpperCase()}
                    </span>
                    {p.full_name}
                  </div>
                </td>
                <td className="px-4 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  {p.email}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {p.total_data}
                </td>
                <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {p.clicked}
                </td>
                <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {p.pending}
                </td>
                <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {p.today_clicks}
                </td>
                <td className="px-4 py-4 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {p.this_week_clicks}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-muted)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${p.progress}%`, background: "var(--text-primary)" }}
                      />
                    </div>
                    <span className="text-xs w-10 text-right" style={{ color: "var(--text-muted)" }}>
                      {p.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPerformance.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                  No data for this user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DashboardTable>
    </div>
  );
}
