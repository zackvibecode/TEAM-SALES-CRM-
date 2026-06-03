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
    <div className="space-y-6">
      {newBatchCount > 0 && (
        <div className="alert-success flex items-center gap-2">
          <ListChecks className="w-5 h-5 shrink-0" />
          <span>
            <strong>{newBatchCount}</strong> new batch(es) assigned in the last 7 days.{" "}
            <Link href="/dashboard/sales/customers" className="underline font-medium">
              Start your queue →
            </Link>
          </span>
        </div>
      )}

      {kpiClicks != null && kpiClicks > 0 && (
        <div className="card-padded">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            Monthly click target
          </h2>
          <div>
            <p className="text-xs text-slate-500 mb-1">Clicks target: {kpiClicks}</p>
            <BatchProgressBar
              progress={Math.min(100, Math.round((monthClicks / kpiClicks) * 100))}
              pending={Math.max(0, kpiClicks - monthClicks)}
              total={kpiClicks}
            />
            <p className="text-xs text-slate-500 mt-1">{monthClicks} clicks this month</p>
          </div>
        </div>
      )}

      {activeBatches.length > 0 && (
        <div className="card-padded">
          <h2 className="font-semibold text-slate-900 mb-4">My assigned batches</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeBatches.map((b) => (
              <Link
                key={b.id}
                href="/dashboard/sales/customers"
                className="block p-4 rounded-2xl glass hover:shadow-[var(--shadow-glass-lg)] transition"
              >
                <div className="font-medium text-slate-800 text-sm">{b.label}</div>
                {b.source_tag && (
                  <span className="text-xs text-slate-400">{b.source_tag}</span>
                )}
                <div className="mt-3">
                  <BatchProgressBar
                    progress={b.progress}
                    pending={b.pending}
                    total={b.total}
                    compact
                  />
                </div>
                <p className="text-xs text-blue-600 mt-2 font-semibold">{b.pending} pending → work now</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
