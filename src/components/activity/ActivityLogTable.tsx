"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Search, X } from "lucide-react";
import {
  formatActivityDate,
  formatActivityTime,
  type ActivityLogItem,
} from "@/lib/activity-log";

type DateFilter = "all" | "today" | "week" | "month" | "year" | "custom";

function getDateRange(filter: DateFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "all":
      return { start: null, end: null };
    case "today":
      return { start: todayStart, end: null };
    case "week": {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { start: weekStart, end: null };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: null };
    default:
      return { start: null, end: null };
  }
}

export function ActivityLogTable({
  initialActivities,
  salesUsers = [],
  showSalesUserFilter = false,
  showSalesUserColumn = true,
}: {
  initialActivities: ActivityLogItem[];
  salesUsers?: string[];
  showSalesUserFilter?: boolean;
  showSalesUserColumn?: boolean;
}) {
  const [activities] = useState(initialActivities);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [salesUserFilter, setSalesUserFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = activities;

    const range = getDateRange(dateFilter);
    if (range.start) {
      const startTime = range.start.getTime();
      result = result.filter((a) => new Date(a.created_at).getTime() >= startTime);
    }
    if (dateFilter === "custom") {
      if (customStart) {
        const s = new Date(customStart).getTime();
        result = result.filter((a) => new Date(a.created_at).getTime() >= s);
      }
      if (customEnd) {
        const e = new Date(customEnd).setHours(23, 59, 59, 999);
        result = result.filter((a) => new Date(a.created_at).getTime() <= e);
      }
    }

    if (showSalesUserFilter && salesUserFilter !== "all") {
      result = result.filter((a) => a.sales_name === salesUserFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.sales_name.toLowerCase().includes(s) ||
          a.lead_name.toLowerCase().includes(s) ||
          a.lead_whatsapp.toLowerCase().includes(s)
      );
    }

    return result;
  }, [activities, dateFilter, search, customStart, customEnd, salesUserFilter, showSalesUserFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const filterButtons: { label: string; value: DateFilter }[] = [
    { label: "All", value: "all" },
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
    { label: "Custom", value: "custom" },
  ];

  const colSpan =
    4 + (showSalesUserColumn ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                setDateFilter(btn.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                dateFilter === btn.value ? "filter-pill-active" : "filter-pill"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs max-w-[140px]"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs max-w-[140px]"
            />
          </div>
        )}

        {showSalesUserFilter && salesUsers.length > 0 && (
          <select
            value={salesUserFilter}
            onChange={(e) => {
              setSalesUserFilter(e.target.value);
              setPage(1);
            }}
            className="input-field py-1.5 text-xs max-w-[180px]"
          >
            <option value="all">All sales users</option>
            {salesUsers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        <div className="relative max-w-xs flex-1 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10 py-1.5"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} clicks
        </span>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                {showSalesUserColumn && <th className="table-th">Sales User</th>}
                <th className="table-th">Customer</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th">Time</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.id} className="table-row">
                  {showSalesUserColumn && (
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {a.sales_name}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {a.lead_name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {a.lead_whatsapp}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status="Clicked" />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatActivityDate(a.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatActivityTime(a.created_at)}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    No WhatsApp clicks found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
