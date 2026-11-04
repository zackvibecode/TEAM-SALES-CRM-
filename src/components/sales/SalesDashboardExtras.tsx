"use client";

import Link from "next/link";
import { ListChecks, Target, ArrowRight } from "lucide-react";

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

const MAX_BATCHES = 5;

function MiniBar({ pct }: { pct: number }) {
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden w-20 shrink-0"
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
  const activeBatches = batches.filter((b) => !b.label.startsWith("[archived]"));
  const shownBatches = activeBatches.slice(0, MAX_BATCHES);
  const hiddenCount = activeBatches.length - shownBatches.length;
  const showTarget = kpiClicks != null && kpiClicks > 0;
  const showBatches = activeBatches.length > 0;

  if (!showTarget && !showBatches && newBatchCount === 0) return null;

  return (
    <div className="space-y-4">
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

      <div className="card-padded-sm grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-5">
        {showTarget && (
          <div>
            <h2
              className="font-semibold flex items-center gap-2 mb-3 text-sm"
              style={{ color: "var(--text-primary)" }}
            >
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
              <MiniBar pct={Math.min(100, Math.round((monthClicks / kpiClicks!) * 100))} />
            </div>
          </div>
        )}

        {showBatches && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                My assigned batches
              </h2>
              <Link
                href="/dashboard/sales/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline shrink-0"
                style={{ color: "var(--color-primary-600, #2563eb)" }}
              >
                View all ({activeBatches.length})
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--border-color)" }}>
              {shownBatches.map((b) => (
                <Link
                  key={b.id}
                  href="/dashboard/sales/tasks"
                  className="flex items-center gap-3 py-2 transition hover:bg-[var(--surface-hover)] group"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span
                    className="text-sm font-medium truncate flex-1 min-w-0"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {b.label}
                  </span>
                  <MiniBar pct={b.progress} />
                  <span
                    className="text-xs font-semibold tabular-nums shrink-0 w-16 text-right"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {b.pending} pending
                  </span>
                </Link>
              ))}
            </div>
            {hiddenCount > 0 && (
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                +{hiddenCount} more batch{hiddenCount > 1 ? "es" : ""} in your task queue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
