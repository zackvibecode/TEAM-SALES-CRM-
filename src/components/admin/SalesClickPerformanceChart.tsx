"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardMetricTile } from "@/components/shared/DashboardMetricTile";
import {
  DATE_PRESET_LABELS,
  SORT_LABELS,
  type SalesClickDatePreset,
  type SalesClickPerformanceResult,
  type SalesClickSortKey,
} from "@/lib/admin/sales-click-performance";
import {
  BarChart3,
  Crown,
  Loader2,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";

const PRESETS: SalesClickDatePreset[] = [
  "today",
  "yesterday",
  "last7",
  "week",
  "month",
  "custom",
];

const SORT_OPTIONS: SalesClickSortKey[] = ["highest", "lowest", "az", "za"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SalesClickPerformanceChart() {
  const [preset, setPreset] = useState<SalesClickDatePreset>("today");
  const [sortBy, setSortBy] = useState<SalesClickSortKey>("highest");
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesClickPerformanceResult | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ preset, sort: sortBy });
      if (preset === "custom") {
        if (customStart) params.set("startDate", customStart);
        if (customEnd) params.set("endDate", customEnd);
      }
      const res = await fetch(`/api/admin/sales-click-performance?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json as SalesClickPerformanceResult);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, [preset, sortBy, customStart, customEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const maxClicks = useMemo(() => {
    if (!data?.rows.length) return 1;
    return Math.max(...data.rows.map((r) => r.total_clicks), 1);
  }, [data]);

  const topId = useMemo(() => {
    if (!data?.rows.length) return null;
    const sorted = [...data.rows].sort((a, b) => b.total_clicks - a.total_clicks);
    return sorted[0]?.sales_user_id ?? null;
  }, [data]);

  return (
    <section className="card-padded-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <span className="icon-stat text-blue-600">
              <BarChart3 />
            </span>
            Sales Click Performance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            WhatsApp clicks by sales team based on selected date range.
          </p>
        </div>
        <select
          className="input-field max-w-[200px] py-2 text-sm shrink-0"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SalesClickSortKey)}
        >
          {SORT_OPTIONS.map((key) => (
            <option key={key} value={key}>
              Sort: {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-xl border transition",
              preset === key ? "filter-pill-active" : "filter-pill"
            )}
          >
            {DATE_PRESET_LABELS[key]}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
          <label className="text-xs font-medium text-slate-600 space-y-1 block">
            Start date
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-field py-2 text-sm block mt-1"
            />
          </label>
          <label className="text-xs font-medium text-slate-600 space-y-1 block">
            End date
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-field py-2 text-sm block mt-1"
            />
          </label>
          <button type="button" onClick={load} className="btn-primary-solid px-4 py-2 text-sm">
            Apply
          </button>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <DashboardMetricTile
            label="Total Clicks"
            value={data.summary.total_clicks}
            icon={MousePointerClick}
            accent="blue"
            highlight
          />
          <DashboardMetricTile
            label="Top Sales User"
            value={data.summary.top_sales_user ?? "—"}
            icon={Crown}
            accent="amber"
          />
          <DashboardMetricTile
            label="Active Sales Users"
            value={data.summary.active_sales_users}
            icon={Users}
            accent="sky"
          />
          <DashboardMetricTile
            label="Average Clicks"
            value={data.summary.average_clicks}
            icon={TrendingUp}
            accent="mint"
          />
        </div>
      )}

      <div className="glass-strong rounded-2xl p-3 md:p-4 min-h-[220px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : !data?.rows.length ? (
          <div className="text-center py-10 px-4">
            <p className="text-slate-700 font-medium">
              No WhatsApp click activity found for this date range.
            </p>
            <p className="text-sm text-slate-500 mt-2">Try selecting a different date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div
              className="flex items-end gap-3 md:gap-5 min-w-full"
              style={{ minWidth: `${Math.max(data.rows.length * 88, 320)}px` }}
            >
              {data.rows.map((row) => {
                const heightPct = Math.max(8, Math.round((row.total_clicks / maxClicks) * 100));
                const isTop = row.sales_user_id === topId && row.total_clicks > 0;
                const isHovered = hoveredId === row.sales_user_id;

                return (
                  <div
                    key={row.sales_user_id}
                    className="flex flex-col items-center flex-1 min-w-[72px] max-w-[120px]"
                    onMouseEnter={() => setHoveredId(row.sales_user_id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative w-full flex flex-col items-center justify-end h-[170px]">
                      {(isHovered || isTop) && (
                        <div
                          className={cn(
                            "absolute -top-1 z-20 px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-lg border whitespace-nowrap",
                            isTop
                              ? "bg-slate-900 text-white border-slate-700"
                              : "bg-white text-slate-800 border-blue-200"
                          )}
                        >
                          {row.total_clicks} click{row.total_clicks !== 1 ? "s" : ""}
                          {isTop && (
                            <span className="block text-[10px] font-semibold text-amber-300 mt-0.5">
                              Top performer
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "w-full max-w-[48px] rounded-t-xl rounded-b-md transition-all duration-300 relative",
                          isTop && "ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white/80"
                        )}
                        style={{
                          height: `${heightPct}%`,
                          background: isTop
                            ? "linear-gradient(180deg, #60a5fa 0%, #2563eb 55%, #1d4ed8 100%)"
                            : "linear-gradient(180deg, #93c5fd 0%, #3b82f6 60%, #2563eb 100%)",
                          boxShadow: isHovered
                            ? "0 12px 28px -6px rgba(37, 99, 235, 0.55), 0 4px 12px rgba(59, 130, 246, 0.35)"
                            : "0 8px 20px -8px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
                          transform: isHovered ? "translateY(-4px) scale(1.02)" : undefined,
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1/3 rounded-t-2xl opacity-40"
                          style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
                          }}
                        />
                      </div>
                    </div>

                    <p
                      className={cn(
                        "mt-3 text-xs md:text-sm font-semibold text-center truncate w-full px-1",
                        isTop ? "text-blue-700" : "text-slate-700"
                      )}
                      title={row.sales_user_name}
                    >
                      {row.sales_user_name}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {row.total_clicks} clicks
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {data && data.rows.length > 0 && (
        <p className="text-xs text-slate-400 text-center">
          Showing {data.startDate}
          {data.startDate !== data.endDate ? ` → ${data.endDate}` : ""}
          {" · "}
          {data.rows.length} sales user{data.rows.length !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}
