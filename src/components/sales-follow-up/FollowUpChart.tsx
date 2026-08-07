"use client";

import type { ChartDataPoint } from "@/lib/sales-follow-up/types";
import { BarChart3 } from "lucide-react";

interface FollowUpChartProps {
  data: ChartDataPoint[];
}

export function FollowUpChart({ data }: FollowUpChartProps) {
  const maxValue = Math.max(...data.map((d) => d.total_activities), 1);

  if (data.length === 0) {
    return (
      <div
        className="surface-card rounded-xl p-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <BarChart3 className="size-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Tiada data untuk dipaparkan.</p>
        <p className="text-xs mt-1">Tambah lead dan follow-up untuk melihat carta prestasi.</p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="size-5" style={{ color: "var(--text-secondary)" }} />
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          Follow-Up Performance by PIC
        </h3>
      </div>

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.pic_name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.pic_name}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.total_activities}
                  </span>{" "}
                  aktiviti
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.leads_assigned}
                  </span>{" "}
                  lead
                </span>
              </div>
            </div>

            <div className="relative h-7 rounded-full overflow-hidden bg-[var(--surface-muted)]">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out flex items-center"
                style={{
                  width: `${Math.max((item.total_activities / maxValue) * 100, 3)}%`,
                  backgroundColor: "var(--color-brand-500, #9fe870)",
                  minWidth: "24px",
                }}
              >
                {item.total_activities > 0 && (
                  <span
                    className="text-[11px] font-bold pl-2.5 tabular-nums"
                    style={{ color: "#163300" }}
                  >
                    {item.total_activities}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-1">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold">{item.leads_followed_up}</span> difollow-up
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold">{item.leads_three_plus}</span> min 3x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
