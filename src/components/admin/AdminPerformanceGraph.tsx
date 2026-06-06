"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { RecentActivityCard } from "@/components/shared/RecentActivityCard";
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

export function AdminPerformanceGraph({ showLeaderboard = true }: { showLeaderboard?: boolean }) {
  const [preset, setPreset] = useState<SalesClickDatePreset>("week");
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

  const leaderboardItems = useMemo(() => {
    if (!data?.rows.length) return [];
    return [...data.rows]
      .sort((a, b) => b.total_clicks - a.total_clicks || a.sales_user_name.localeCompare(b.sales_user_name))
      .slice(0, 5)
      .map((row, index) => ({
        id: row.sales_user_id,
        name: row.sales_user_name,
        detail: `${row.total_clicks} clicks · ${row.follow_up_count} follow ups`,
        meta: `#${index + 1}`,
        rank: index + 1,
      }));
  }, [data]);

  const rangeLabel = data
    ? `${data.startDate}${data.startDate !== data.endDate ? ` → ${data.endDate}` : ""}`
    : "";

  const graphPanel = (
    <section className="card-padded-sm flex flex-col gap-5 h-full min-h-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 shrink-0">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-base" style={{ color: "var(--text-primary)" }}>
            <span className="icon-stat">
              <BarChart3 />
            </span>
            Overall sales clicks
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            WhatsApp clicks by sales team for the selected date range.
          </p>
        </div>
        <select
          className="input-field max-w-[220px] py-2 text-sm shrink-0"
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

      <div className="flex flex-wrap gap-2 shrink-0">
        {PRESETS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={cn(
              "px-3 py-2 text-xs font-semibold border transition",
              preset === key ? "filter-pill-active" : "filter-pill"
            )}
          >
            {DATE_PRESET_LABELS[key]}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end shrink-0">
          <label className="text-xs font-medium space-y-1 block" style={{ color: "var(--text-secondary)" }}>
            Start date
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-field py-2 text-sm block mt-1"
            />
          </label>
          <label className="text-xs font-medium space-y-1 block" style={{ color: "var(--text-secondary)" }}>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <StatCard label="Total Clicks" value={data.summary.total_clicks} icon={MousePointerClick} variant="primary" />
          <StatCard
            label="Top Sales User"
            value={data.summary.top_sales_user ?? "—"}
            icon={Crown}
            accent="amber"
            valueSize="compact"
          />
          <StatCard label="Active Sales Users" value={data.summary.active_sales_users} icon={Users} accent="sky" />
          <StatCard label="Average Clicks" value={data.summary.average_clicks} icon={TrendingUp} accent="mint" />
        </div>
      )}

      <div
        className="rounded-2xl p-4 flex-1 min-h-[300px] border overflow-visible"
        style={{ background: "var(--surface-muted)", borderColor: "var(--border-color)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#3b66ff]" />
          </div>
        ) : !data?.rows.length ? (
          <div className="text-center py-12 px-4">
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              No WhatsApp click activity found for this date range.
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Try selecting a different date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible pb-2">
            <div
              className="flex items-end gap-4 min-w-full px-2 pt-2"
              style={{ minWidth: `${Math.max(data.rows.length * 80, 320)}px` }}
            >
              {data.rows.map((row) => {
                const heightPct = Math.max(8, Math.round((row.total_clicks / maxClicks) * 100));
                const isTop = row.sales_user_id === topId && row.total_clicks > 0;
                const isHovered = hoveredId === row.sales_user_id;

                return (
                  <div
                    key={row.sales_user_id}
                    className="flex flex-col items-center flex-1 min-w-[64px] max-w-[100px]"
                    onMouseEnter={() => setHoveredId(row.sales_user_id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative w-full flex flex-col items-center justify-end h-[210px]">
                      {(isHovered || isTop) && (
                        <div
                          className={cn(
                            "absolute top-0 z-20 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-lg border whitespace-nowrap surface-card -translate-y-1",
                            isTop && "ring-2 ring-amber-400/60"
                          )}
                          style={{ color: "var(--text-primary)" }}
                        >
                          {row.total_clicks} click{row.total_clicks !== 1 ? "s" : ""}
                          {isTop && (
                            <span className="block text-[10px] font-semibold text-amber-500 mt-0.5">
                              Top performer
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "w-full max-w-[44px] rounded-t-xl rounded-b-sm transition-all duration-300 relative mt-12",
                          isTop && "ring-2 ring-[#3b66ff]/40 ring-offset-2"
                        )}
                        style={{
                          height: `${heightPct}%`,
                          minHeight: "24px",
                          background: isTop
                            ? "linear-gradient(180deg, #6b8cff 0%, #3b66ff 55%, #2952e6 100%)"
                            : "linear-gradient(180deg, #a5b8ff 0%, #3b66ff 70%, #2952e6 100%)",
                          boxShadow: isHovered
                            ? "0 10px 24px -6px rgba(59, 102, 255, 0.5)"
                            : "0 6px 16px -6px rgba(59, 102, 255, 0.35)",
                          transform: isHovered ? "translateY(-3px)" : undefined,
                        }}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl opacity-30"
                          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }}
                        />
                      </div>
                    </div>

                    <p
                      className={cn(
                        "mt-3 text-xs font-semibold text-center truncate w-full px-1",
                        isTop ? "text-[#3b66ff]" : ""
                      )}
                      style={isTop ? undefined : { color: "var(--text-primary)" }}
                      title={row.sales_user_name}
                    >
                      {row.sales_user_name}
                    </p>
                    <p className="text-[11px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>
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
        <p className="text-xs text-center shrink-0" style={{ color: "var(--text-muted)" }}>
          {rangeLabel}
          {" · "}
          {data.rows.length} sales user{data.rows.length !== 1 ? "s" : ""}
        </p>
      )}
    </section>
  );

  if (!showLeaderboard) {
    return graphPanel;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
      <div className="xl:col-span-2 min-h-0 flex">{graphPanel}</div>
      <div className="min-h-0 flex">
        <RecentActivityCard
          title="Leaderboard"
          subtitle={
            loading
              ? "Loading team performance…"
              : `${DATE_PRESET_LABELS[preset]}${rangeLabel ? ` · ${rangeLabel}` : ""}`
          }
          items={leaderboardItems}
          emptyMessage="No team activity for this date range."
        />
      </div>
    </div>
  );
}
