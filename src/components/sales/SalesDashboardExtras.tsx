"use client";

import Link from "next/link";
import { BatchProgressBar } from "@/components/shared/BatchProgressBar";
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
            <Link href="/dashboard/sales/customers" className="underline font-medium">
              Start your queue →
            </Link>
          </span>
        </div>
      )}

      {kpiClicks != null && kpiClicks > 0 && (
        <div className="card-padded-sm">
          <h2 className="font-semibold flex items-center gap-2 mb-3 text-sm" style={{ color: "var(--text-primary)" }}>
            <Target className="w-4 h-4 text-[#3b66ff]" />
            Monthly click target
          </h2>
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Clicks target: {kpiClicks}</p>
            <BatchProgressBar
              progress={Math.min(100, Math.round((monthClicks / kpiClicks) * 100))}
              pending={Math.max(0, kpiClicks - monthClicks)}
              total={kpiClicks}
            />
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{monthClicks} clicks this month</p>
          </div>
        </div>
      )}

      {activeBatches.length > 0 && (
        <div className="card-padded-sm">
          <h2 className="font-semibold mb-4 text-sm" style={{ color: "var(--text-primary)" }}>
            My assigned batches
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeBatches.map((b) => (
              <Link
                key={b.id}
                href="/dashboard/sales/customers"
                className="block p-4 rounded-xl border transition hover:shadow-md"
                style={{ background: "var(--surface-card)", borderColor: "var(--border-color)" }}
              >
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{b.label}</div>
                {b.source_tag && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.source_tag}</span>
                )}
                <div className="mt-3">
                  <BatchProgressBar progress={b.progress} pending={b.pending} total={b.total} compact />
                </div>
                <p className="text-xs text-[#3b66ff] mt-2 font-semibold">{b.pending} pending → work now</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
