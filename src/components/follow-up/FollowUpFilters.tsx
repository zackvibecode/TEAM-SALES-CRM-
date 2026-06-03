"use client";

import { cn } from "@/lib/utils";
import type { FollowUpFilterTab } from "@/lib/follow-up/dates";
import { filterTabLabel } from "@/lib/follow-up/dates";
import type { FollowUpSortKey } from "@/lib/follow-up/types";

const TABS: FollowUpFilterTab[] = [
  "today",
  "tomorrow",
  "overdue",
  "yesterday",
  "week",
  "completed",
  "all",
];

export function FollowUpFilters({
  filter,
  sort,
  salesUserFilter,
  salesUsers,
  showSalesFilter,
  onFilterChange,
  onSortChange,
  onSalesUserChange,
}: {
  filter: FollowUpFilterTab;
  sort: FollowUpSortKey;
  salesUserFilter: string;
  salesUsers?: { id: string; full_name: string }[];
  showSalesFilter?: boolean;
  onFilterChange: (f: FollowUpFilterTab) => void;
  onSortChange: (s: FollowUpSortKey) => void;
  onSalesUserChange?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onFilterChange(tab)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold",
              filter === tab ? "filter-pill-active" : "filter-pill"
            )}
          >
            {filterTabLabel(tab)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="input-field max-w-[220px] py-2 text-xs"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as FollowUpSortKey)}
        >
          <option value="follow_up_date">Sort: Next follow up date</option>
          <option value="last_contacted">Sort: Last contacted</option>
          <option value="follow_up_number">Sort: Follow up number</option>
          <option value="sales_user">Sort: Sales user</option>
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
