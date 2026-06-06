"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { RecentActivityCard } from "@/components/shared/RecentActivityCard";
import { buildLeaderboardItems, type LeaderboardRow } from "@/lib/leaderboard";

interface Props {
  currentUserId?: string;
  className?: string;
}

export function TeamLeaderboard({ currentUserId, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setRows((json.rows as LeaderboardRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      subtitle="All-time rankings"
      items={buildLeaderboardItems(rows, { currentUserId })}
      emptyMessage="No team data yet."
      className={className}
      fillHeight
    />
  );
}
