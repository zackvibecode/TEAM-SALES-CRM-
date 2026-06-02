"use client";

interface BatchProgressBarProps {
  progress: number;
  pending: number;
  total: number;
  compact?: boolean;
}

export function BatchProgressBar({ progress, pending, total, compact }: BatchProgressBarProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{total - pending} / {total} worked</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
