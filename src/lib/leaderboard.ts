import type { ActivityItem } from "@/components/shared/RecentActivityCard";

export interface LeaderboardRow {
  id: string;
  name: string;
  total: number;
  clicked: number;
  pending: number;
  followUp: number;
}

export function sortLeaderboardRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  return [...rows].sort(
    (a, b) => b.clicked - a.clicked || a.name.localeCompare(b.name)
  );
}

export function buildLeaderboardItems(
  rows: LeaderboardRow[],
  options?: { currentUserId?: string }
): ActivityItem[] {
  return sortLeaderboardRows(rows).map((row, index) => ({
    id: row.id,
    name: row.name,
    detail: `${row.clicked.toLocaleString()} clicks · all-time`,
    meta: options?.currentUserId === row.id ? "You" : `#${index + 1}`,
    rank: index + 1,
  }));
}
