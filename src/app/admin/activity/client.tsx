"use client";

import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArrowRight, Search, X } from "lucide-react";

interface ActivityItem {
  id: string;
  sales_name: string;
  lead_name: string;
  lead_whatsapp: string;
  activity_type: string;
  message?: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

type DateFilter = "all" | "today" | "week" | "month" | "year" | "custom";

function getDateRange(filter: DateFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "all": return { start: null, end: null };
    case "today": return { start: todayStart, end: null };
    case "week": {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { start: weekStart, end: null };
    }
    case "month": return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
    case "year": return { start: new Date(now.getFullYear(), 0, 1), end: null };
    default: return { start: null, end: null };
  }
}

export function ActivityClient({ initialActivities }: { initialActivities: ActivityItem[] }) {
  const [activities] = useState(initialActivities);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = activities;

    // Date filter
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

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((a) =>
        a.sales_name.toLowerCase().includes(s) ||
        a.lead_name.toLowerCase().includes(s) ||
        a.activity_type.toLowerCase().includes(s) ||
        (a.message?.toLowerCase().includes(s) ?? false)
      );
    }

    return result;
  }, [activities, dateFilter, search, customStart, customEnd]);

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
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date filter buttons */}
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

        {/* Custom date inputs */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs max-w-[140px]"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs max-w-[140px]"
            />
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-xs flex-1 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10 py-1.5"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length} activities</span>
      </div>

      {/* Table */}
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="table-th">Sales User</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Type</th>
                <th className="table-th">Change</th>
                <th className="table-th">Time</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{a.sales_name}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{a.lead_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.lead_whatsapp}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.activity_type === "whatsapp_clicked" ? "bg-primary-light text-primary" :
                      a.activity_type === "status_updated" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {a.activity_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(a.old_status || a.new_status) ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        {a.old_status ? (
                          <StatusBadge status={a.old_status as "Pending" | "Clicked" | "Follow Up" | "Interested" | "Not Interested" | "No Response" | "Converted"} />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>-</span>
                        )}
                        <ArrowRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                        {a.new_status ? (
                          <StatusBadge status={a.new_status as "Pending" | "Clicked" | "Follow Up" | "Interested" | "Not Interested" | "No Response" | "Converted"} />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>-</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.message || a.notes || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(a.created_at).toLocaleString("en-MY")}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>No activities found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
