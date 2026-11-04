"use client";

import Link from "next/link";
import { ListChecks, Target } from "lucide-react";

export interface SalesBatchCard {
  id: string;
  label: string;
  source_tag: string | null;
  total: number;
  pending: number;
  progress: number;
  created_at: string;
}

interface Props {
  batches: SalesBatchCard[];
  newBatchCount: number;
  kpiClicks: number | null;
  monthClicks: number;
}

function MiniBar({ pct }: { pct: number }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden w-24 shrink-0"
      style={{ background: "var(--surface-muted)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: "var(--color-primary-500, #3b82f6)",
        }}
      />
    </div>
  );
}

export function SalesDashboardExtras({
  batches,
  newBatchCount,
  kpiClicks,
  monthClicks,
}: Props) {
  const activeBatches = batches.filter((b) => !b.label.startsWith("[archived]")).slice(0, 6);

  return (
    <div className="space-y-5">
      {newBatchCount > 0 && (
        <div className="alert-success flex items-center gap-2 text-xs">
          <ListChecks className="w-4 h-4 shrink-0" />
          <span>
            <strong>{newBatchCount}</strong> new batch(es) assigned in the last 7 days.{" "}
            <Link href="/dashboard/sales/tasks" className="underline font-medium">
              Start your queue →
            </Link>
          </span>
        </div>
      )}

      {(kpiClicks != null && kpiClicks > 0 || activeBatches.length > 0) && (
        <div className="card-padded-sm space-y-5">
          {kpiClicks != null && kpiClicks > 0 && (
            <div>
              <h2 className="font-semibold flex items-center gap-2 mb-3 text-sm" style={{ color: "var(--text-primary)" }}>
                <Target className="w-4 h-4 text-[#2563eb]" />
                Monthly click target
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {monthClicks}
                  <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    {" "}/ {kpiClicks} clicks
                  </span>
                </p>
                <MiniBar pct={Math.min(100, Math.round((monthClicks / kpiClicks) * 100))} />
              </div>
            </div>
          )}

          {activeBatches.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-sm" style={{ color: "var(--text-primary)" }}>
                My assigned batches
              </h2>
              <div className="flex flex-col gap-1">
                {activeBatches.map((b) => (
                  <Link
                    key={b.id}
                    href="/dashboard/sales/tasks"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-[var(--surface-hover)] group"
                  >
                    <span
                      className="text-sm font-medium truncate flex-1 min-w-0"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {b.label}
                    </span>
                    <MiniBar pct={b.progress} />
                    <span
                      className="text-xs font-semibold tabular-nums shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {b.pending} pending
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
