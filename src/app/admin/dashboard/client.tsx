"use client";

import { useState, useMemo } from "react";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { AdminPerformanceGraph } from "@/components/admin/AdminPerformanceGraph";
import { DashboardTable } from "@/components/shared/DashboardTable";

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

  return (
    <div className="dashboard-shell space-y-5">
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
            aria-label="View sales user"
          >
            <option value="all">All Sales Users</option>
            {salesProfiles.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.full_name}
              </option>
            ))}
          </select>
        }
      />

      {selectedUserId === "all" ? (
        <AdminPerformanceGraph showLeaderboard />
      ) : (
        <AdminPerformanceGraph showLeaderboard={false} />
      )}

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
