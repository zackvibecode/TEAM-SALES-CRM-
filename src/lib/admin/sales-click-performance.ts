import type { SupabaseClient } from "@supabase/supabase-js";

export type SalesClickDatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "week"
  | "month"
  | "custom";

export type SalesClickSortKey = "highest" | "lowest" | "az" | "za";

export interface SalesClickPerformanceRow {
  sales_user_id: string;
  sales_user_name: string;
  total_clicks: number;
  follow_up_count: number;
}

export interface SalesClickPerformanceSummary {
  total_clicks: number;
  top_sales_user: string | null;
  top_sales_clicks: number;
  active_sales_users: number;
  average_clicks: number;
}

export interface SalesClickPerformanceResult {
  rows: SalesClickPerformanceRow[];
  summary: SalesClickPerformanceSummary;
  startDate: string;
  endDate: string;
}

const CLICK_ACTIONS = ["whatsapp_clicked", "follow_up_clicked"] as const;

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayIso(dateStr: string): string {
  return `${dateStr}T00:00:00.000`;
}

function endOfDayIso(dateStr: string): string {
  return `${dateStr}T23:59:59.999`;
}

export function resolveSalesClickDateRange(
  preset: SalesClickDatePreset,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string; startIso: string; endIso: string } {
  const now = new Date();
  const today = toDateString(now);

  let startDate = today;
  let endDate = today;

  switch (preset) {
    case "today":
      break;
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      startDate = toDateString(d);
      endDate = startDate;
      break;
    }
    case "last7": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      startDate = toDateString(d);
      endDate = today;
      break;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      startDate = toDateString(d);
      endDate = today;
      break;
    }
    case "month": {
      startDate = toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
      endDate = today;
      break;
    }
    case "custom":
      if (customStart) startDate = customStart;
      if (customEnd) endDate = customEnd || customStart || today;
      if (customStart && !customEnd) endDate = customStart;
      break;
  }

  if (startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }

  return {
    startDate,
    endDate,
    startIso: startOfDayIso(startDate),
    endIso: endOfDayIso(endDate),
  };
}

function sortRows(rows: SalesClickPerformanceRow[], sortBy: SalesClickSortKey): SalesClickPerformanceRow[] {
  const list = [...rows];
  switch (sortBy) {
    case "lowest":
      return list.sort((a, b) => a.total_clicks - b.total_clicks || a.sales_user_name.localeCompare(b.sales_user_name));
    case "az":
      return list.sort((a, b) => a.sales_user_name.localeCompare(b.sales_user_name));
    case "za":
      return list.sort((a, b) => b.sales_user_name.localeCompare(a.sales_user_name));
    case "highest":
    default:
      return list.sort((a, b) => b.total_clicks - a.total_clicks || a.sales_user_name.localeCompare(b.sales_user_name));
  }
}

function buildSummary(rows: SalesClickPerformanceRow[]): SalesClickPerformanceSummary {
  const total_clicks = rows.reduce((sum, r) => sum + r.total_clicks, 0);
  const active = rows.filter((r) => r.total_clicks > 0);
  const top = active[0] ?? null;

  return {
    total_clicks,
    top_sales_user: top?.sales_user_name ?? null,
    top_sales_clicks: top?.total_clicks ?? 0,
    active_sales_users: active.length,
    average_clicks: active.length > 0 ? Math.round((total_clicks / active.length) * 10) / 10 : 0,
  };
}

export async function getAdminSalesClickPerformance(
  db: SupabaseClient,
  opts: {
    startDate: string;
    endDate: string;
    sortBy?: SalesClickSortKey;
  }
): Promise<SalesClickPerformanceResult> {
  const { startIso, endIso, startDate, endDate } = resolveSalesClickDateRange("custom", opts.startDate, opts.endDate);
  const sortBy = opts.sortBy ?? "highest";

  const counts = new Map<string, { name: string; clicks: number; followUps: number }>();
  const pageSize = 1000;
  let offset = 0;

  async function ingestActionTypes(actionTypes: readonly string[], field: "clicks" | "followUps") {
    offset = 0;
    while (true) {
      const { data, error } = await db
        .from("activity_logs")
        .select("sales_user_id, sales_user_name")
        .in("action_type", [...actionTypes])
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) throw new Error(error.message);
      const batch = data ?? [];
      if (batch.length === 0) break;

      for (const row of batch) {
        const id = row.sales_user_id;
        if (!id) continue;
        const name = (row.sales_user_name ?? "Unknown").trim() || "Unknown";
        const existing = counts.get(id);
        if (existing) {
          if (field === "clicks") existing.clicks += 1;
          else existing.followUps += 1;
        } else {
          counts.set(id, { name, clicks: field === "clicks" ? 1 : 0, followUps: field === "followUps" ? 1 : 0 });
        }
      }

      if (batch.length < pageSize) break;
      offset += pageSize;
    }
  }

  await ingestActionTypes(CLICK_ACTIONS, "clicks");
  await ingestActionTypes(["follow_up_completed"], "followUps");

  const rows = sortRows(
    [...counts.entries()].map(([sales_user_id, { name, clicks, followUps }]) => ({
      sales_user_id,
      sales_user_name: name,
      total_clicks: clicks,
      follow_up_count: followUps,
    })),
    sortBy
  );

  const summarySource = sortRows(
    rows.map((r) => ({ ...r })),
    "highest"
  );

  return {
    rows,
    summary: buildSummary(summarySource),
    startDate,
    endDate,
  };
}

export const DATE_PRESET_LABELS: Record<SalesClickDatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 Days",
  week: "This Week",
  month: "This Month",
  custom: "Custom Range",
};

export const SORT_LABELS: Record<SalesClickSortKey, string> = {
  highest: "Highest Clicks",
  lowest: "Lowest Clicks",
  az: "A to Z",
  za: "Z to A",
};
