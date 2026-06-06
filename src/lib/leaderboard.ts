import type { ActivityItem } from "@/components/shared/RecentActivityCard";
import type { SalesClickPerformanceRow } from "@/lib/admin/sales-click-performance";

export function sortLeaderboardRows(rows: SalesClickPerformanceRow[]): SalesClickPerformanceRow[] {
  return [...rows].sort(
    (a, b) =>
      b.total_clicks - a.total_clicks ||
      b.follow_up_count - a.follow_up_count ||
      a.sales_user_name.localeCompare(b.sales_user_name)
  );
}

export function buildLeaderboardItems(
  rows: SalesClickPerformanceRow[],
  options?: { currentUserId?: string }
): ActivityItem[] {
  return sortLeaderboardRows(rows).map((row, index) => ({
    id: row.sales_user_id,
    name: row.sales_user_name,
    detail: `${row.total_clicks} clicks · ${row.follow_up_count} follow ups`,
    meta: options?.currentUserId === row.sales_user_id ? "You" : `#${index + 1}`,
    rank: index + 1,
  }));
}
