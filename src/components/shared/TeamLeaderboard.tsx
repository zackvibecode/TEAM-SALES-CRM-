"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RecentActivityCard } from "@/components/shared/RecentActivityCard";
import { buildLeaderboardItems } from "@/lib/leaderboard";
import {
  DATE_PRESET_LABELS,
  type SalesClickDatePreset,
  type SalesClickPerformanceResult,
} from "@/lib/admin/sales-click-performance";

interface Props {
  currentUserId?: string;
  preset?: SalesClickDatePreset;
  apiPath?: string;
  subtitle?: string;
  className?: string;
}

export function TeamLeaderboard({
  currentUserId,
  preset = "week",
  apiPath = "/api/sales/leaderboard",
  subtitle,
  className,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesClickPerformanceResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ preset });
      const res = await fetch(`${apiPath}?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json as SalesClickPerformanceResult);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiPath, preset]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeLabel = data
    ? `${data.startDate}${data.startDate !== data.endDate ? ` → ${data.endDate}` : ""}`
    : "";

  const resolvedSubtitle =
    subtitle ??
    (loading
      ? "Loading team performance…"
      : `${DATE_PRESET_LABELS[preset]}${rangeLabel ? ` · ${rangeLabel}` : ""}`);

  if (loading) {
    return (
      <div className={`card-padded-sm h-full flex flex-col items-center justify-center min-h-[280px] ${className ?? ""}`}>
        <Loader2 className="w-6 h-6 animate-spin text-[#3b66ff]" />
      </div>
    );
  }

  return (
    <RecentActivityCard
      title="Leaderboard"
      subtitle={resolvedSubtitle}
      items={buildLeaderboardItems(data?.rows ?? [], { currentUserId })}
      emptyMessage="No team activity for this date range."
      className={className}
      fillHeight
    />
  );
}
