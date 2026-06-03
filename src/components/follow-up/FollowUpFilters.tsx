"use client";

import { cn } from "@/lib/utils";
import type { FollowUpFilterTab } from "@/lib/follow-up/dates";
import { filterTabLabel } from "@/lib/follow-up/dates";
import type { FollowUpSortKey } from "@/lib/follow-up/types";

const TABS: FollowUpFilterTab[] = [
  "today",
  "tomorrow",
  "yesterday",
  "week",
  "custom",
  "all",
];

export function FollowUpFilters({
  filter,
  customDate,
  sort,
  salesUserFilter,
  salesUsers,
  showSalesFilter,
  onFilterChange,
  onCustomDateChange,
  onSortChange,
  onSalesUserChange,
}: {
  filter: FollowUpFilterTab;
  customDate: string;
  sort: FollowUpSortKey;
  salesUserFilter: string;
  salesUsers?: { id: string; full_name: string }[];
  showSalesFilter?: boolean;
  onFilterChange: (f: FollowUpFilterTab) => void;
  onCustomDateChange: (date: string) => void;
  onSortChange: (s: FollowUpSortKey) => void;
  onSalesUserChange?: (id: string) => void;
}) {
  return (
    <div className="card-padded-sm space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onFilterChange(tab)}
            className={cn(
              "px-3 py-2 text-xs font-semibold border transition",
              filter === tab ? "filter-pill-active" : "filter-pill"
            )}
          >
            {filterTabLabel(tab)}
          </button>
        ))}
      </div>

      {filter === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Pick date:
          </label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => onCustomDateChange(e.target.value)}
            className="input-field max-w-[180px] py-2 text-xs"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="input-field max-w-[240px] py-2 text-xs"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as FollowUpSortKey)}
        >
          <option value="follow_up_date">Sort: Next follow up date</option>
          <option value="last_followed_up">Sort: Last follow up date</option>
          <option value="latest_activity">Sort: Latest activity</option>
          <option value="oldest_follow_up">Sort: Oldest follow up</option>
        </select>

        {showSalesFilter && salesUsers && onSalesUserChange && (
          <select
            className="input-field max-w-[220px] py-2 text-xs"
            value={salesUserFilter}
            onChange={(e) => onSalesUserChange(e.target.value)}
          >
            <option value="all">All sales users</option>
            {salesUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
