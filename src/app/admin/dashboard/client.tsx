"use client";

import { useState, useMemo } from "react";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { AdminPerformanceGraph } from "@/components/admin/AdminPerformanceGraph";
import { DashboardTable } from "@/components/shared/DashboardTable";
import { RecentActivityCard } from "@/components/shared/RecentActivityCard";

interface SalesProfile {
  id: string;
  full_name: string;
  email: string;
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
    ? "All Sales Users"
    : salesProfiles.find((s) => s.id === selectedUserId)?.full_name || "Unknown";

  const leaderboard = [...performanceData]
    .sort((a, b) => b.clicked - a.clicked || b.followUp - a.followUp)
    .slice(0, 5);

  const activityItems = leaderboard.map((p, i) => ({
    id: p.id,
    name: p.full_name,
    detail: `${p.clicked} clicks · ${p.followUp} follow ups`,
    meta: `#${i + 1}`,
    rank: i + 1,
  }));

  return (
    <div className="dashboard-shell">
      <div className="card-padded-sm flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
          Viewing:
        </span>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input-field max-w-xs py-2 text-sm sm:flex-1 sm:max-w-sm"
        >
          <option value="all">All Sales Users</option>
          {salesProfiles.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.full_name} ({sp.email})
            </option>
          ))}
        </select>
        <span className="text-[11px] sm:ml-auto" style={{ color: "var(--text-muted)" }}>
          {selectedUserId === "all" ? `${salesProfiles.length} sales users` : "Individual view"}
        </span>
      </div>

      <AdminDashboardOverview
        stats={currentStats}
        showWorkspace={selectedUserId === "all"}
        viewingLabel={
          selectedUserId === "all"
            ? "Team-wide metrics"
            : `Metrics for ${selectedUserName}`
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <AdminPerformanceGraph />
        </div>
        {selectedUserId === "all" && leaderboard.length > 0 && (
          <RecentActivityCard
            title="Leaderboard"
            items={activityItems}
            emptyMessage="No team activity yet."
          />
        )}
      </div>

      <DashboardTable title={`Sales Performance — ${selectedUserName}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-th">Sales Name</th>
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
                  {p.full_name}
                </td>
                <td className="px-4 py-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  {p.email}
                </td>
                <td className="px-4 py-4 text-right">{p.total_data}</td>
                <td className="px-4 py-4 text-right">{p.clicked}</td>
                <td className="px-4 py-4 text-right">{p.pending}</td>
                <td className="px-4 py-4 text-right">{p.today_clicks}</td>
                <td className="px-4 py-4 text-right">{p.this_week_clicks}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-muted)" }}>
                      <div
                        className="h-full rounded-full bg-[#3b66ff] transition-all"
                        style={{ width: `${p.progress}%` }}
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
