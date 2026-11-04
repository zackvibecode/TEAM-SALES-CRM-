"use client";

import type { ChartDataPoint } from "@/lib/sales-follow-up/types";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface FollowUpChartProps {
  data: ChartDataPoint[];
}

export function FollowUpChart({ data }: FollowUpChartProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const maxValue = Math.max(...data.map((d) => d.total_activities), 1);

  if (data.length === 0) {
    return (
      <div
        className="surface-card rounded-xl p-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-sm font-medium">{sf.chartEmpty}</p>
        <p className="text-xs mt-1">{sf.chartEmptyHint}</p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-xl p-5">
      <h3 className="text-sm font-bold mb-5" style={{ color: "var(--text-primary)" }}>
        {sf.chartTitle}
      </h3>

      <div className="space-y-5">
        {data.map((item) => (
          <div key={item.pic_id}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {item.pic_name}
              </span>
              {/* Nombor dominan — aktiviti ialah metrik utama */}
              <span
                className="text-lg font-bold tabular-nums leading-none shrink-0"
                style={{ color: "var(--color-primary-600, #1d4ed8)" }}
              >
                {item.total_activities}
              </span>
            </div>

            {/* Bar nipis — quiet, bukan dekorasi */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--surface-muted)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((item.total_activities / maxValue) * 100, 3)}%`,
                  backgroundColor: "var(--color-primary-500, #3b82f6)",
                }}
              />
            </div>

            <div className="flex gap-4 mt-1.5">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold">{item.leads_assigned}</span> {sf.chartLeads}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold">{item.leads_followed_up}</span> {sf.chartFollowedUp}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold">{item.leads_three_plus}</span> {sf.chartMin3x}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
