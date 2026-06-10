"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  formatActivityDate,
  formatActivityTime,
  type WhatsAppWarningLogItem,
} from "@/lib/activity-log";
import { WHATSAPP_RATE_LIMIT } from "@/lib/whatsapp-rate-limit";

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

function OutcomeBadge({ outcome }: { outcome: WhatsAppWarningLogItem["outcome"] }) {
  const styles = {
    shown: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    wait: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    continue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
  } as const;

  const labels = {
    shown: "Warned",
    wait: "Waited",
    continue: "Continued",
  } as const;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[outcome]}`}
    >
      {labels[outcome]}
    </span>
  );
}

export function WhatsAppWarningLogTable({
  initialWarnings,
  salesUsers = [],
}: {
  initialWarnings: WhatsAppWarningLogItem[];
  salesUsers?: string[];
}) {
  const [warnings] = useState(initialWarnings);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [salesUserFilter, setSalesUserFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = warnings;

    const range = getDateRange(dateFilter);
    if (range.start) {
      const startTime = range.start.getTime();
      result = result.filter((w) => new Date(w.created_at).getTime() >= startTime);
    }
    if (dateFilter === "custom") {
      if (customStart) {
        const s = new Date(customStart).getTime();
        result = result.filter((w) => new Date(w.created_at).getTime() >= s);
      }
      if (customEnd) {
        const e = new Date(customEnd).setHours(23, 59, 59, 999);
        result = result.filter((w) => new Date(w.created_at).getTime() <= e);
      }
    }

    if (salesUserFilter !== "all") {
      result = result.filter((w) => w.sales_name === salesUserFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.sales_name.toLowerCase().includes(s) ||
          w.lead_name.toLowerCase().includes(s) ||
          w.lead_whatsapp.toLowerCase().includes(s)
      );
    }

    return result;
  }, [warnings, dateFilter, search, customStart, customEnd, salesUserFilter]);

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

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Sales users warned after {WHATSAPP_RATE_LIMIT.maxClicks}+ WhatsApp clicks in{" "}
        {WHATSAPP_RATE_LIMIT.windowMinutes} minutes — includes the number they tried to contact and
        whether they waited or continued.
      </p>

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

        {salesUsers.length > 0 && (
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
          {filtered.length} warnings
        </span>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="table-th">Sales User</th>
                <th className="table-th">Customer / Number</th>
                <th className="table-th">Clicks</th>
                <th className="table-th">Response</th>
                <th className="table-th">Date</th>
                <th className="table-th">Time</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((w) => (
                <tr key={w.id} className="table-row">
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {w.sales_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {w.lead_name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {w.lead_whatsapp}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {w.click_count} / {WHATSAPP_RATE_LIMIT.maxClicks}
                  </td>
                  <td className="px-3 py-3">
                    <OutcomeBadge outcome={w.outcome} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatActivityDate(w.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatActivityTime(w.created_at)}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    No rate limit warnings logged yet.
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
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of{" "}
            {filtered.length}
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
