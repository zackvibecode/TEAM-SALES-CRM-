"use client";

import { useState, useMemo } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { AdminResetData } from "@/components/admin/AdminResetData";
import { Users, FileText, List, MousePointerClick, Clock, TrendingUp, Trophy } from "lucide-react";

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
    .sort((a, b) => b.converted - a.converted || b.clicked - a.clicked)
    .slice(0, 5);

  return (
    <>
      <div className="flex items-center gap-3 glass-strong rounded-3xl px-4 py-3">
        <span className="text-sm font-medium text-slate-600 shrink-0">Viewing:</span>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input-field max-w-xs py-2"
        >
          <option value="all">All Sales Users</option>
          {salesProfiles.map((sp) => (
            <option key={sp.id} value={sp.id}>{sp.full_name} ({sp.email})</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
          {selectedUserId === "all" ? `${salesProfiles.length} users` : "Individual view"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sales Users" value={currentStats.salesUsers} icon={Users} accent="sky" />
        <StatCard label="Uploaded Files" value={currentStats.files} icon={FileText} accent="blue" />
        <StatCard label="Total Leads" value={currentStats.leads} icon={List} accent="blue" />
        <StatCard label="Total Clicked" value={currentStats.clicked} icon={MousePointerClick} accent="mint" />
        <StatCard label="Pending" value={currentStats.pending} icon={Clock} accent="amber" />
        <StatCard label="Today Clicks" value={currentStats.clicksToday} icon={TrendingUp} accent="sky" />
        <StatCard label="This Week Clicks" value={currentStats.clicksWeek} icon={TrendingUp} accent="blue" />
      </div>

      {leaderboard.length > 0 && selectedUserId === "all" && (
        <div className="card-padded">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <span className="icon-stat text-amber-600">
              <Trophy className="w-4 h-4" />
            </span>
            Leaderboard (by conversions, then clicks)
          </h2>
          <ol className="space-y-2">
            {leaderboard.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-sm rounded-2xl px-3 py-2.5 glass">
                <span className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-medium flex-1">{p.full_name}</span>
                <span className="text-slate-500">{p.converted} converted</span>
                <span className="text-slate-400">{p.clicked} clicked</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <AdminResetData />

      <div className="table-shell">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Sales Performance — {selectedUserName}</h2>
        </div>
        <div className="overflow-x-auto">
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
                  <td className="px-4 py-3 font-medium text-slate-800">{p.full_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.email}</td>
                  <td className="px-4 py-3 text-right">{p.total_data}</td>
                  <td className="px-4 py-3 text-right">{p.clicked}</td>
                  <td className="px-4 py-3 text-right">{p.pending}</td>
                  <td className="px-4 py-3 text-right">{p.today_clicks}</td>
                  <td className="px-4 py-3 text-right">{p.this_week_clicks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">{p.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPerformance.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No data for this user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
