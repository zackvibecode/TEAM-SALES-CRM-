"use client";

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesPic } from "@/lib/sales-follow-up/types";
import {
  getFollowUpFilterOptions,
  getLeadStatusOptions,
} from "@/lib/sales-follow-up/labels";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface FilterBarProps {
  startDate: string;
  endDate: string;
  picId: string;
  status: string;
  search: string;
  followUpFilter: string;
  pics: SalesPic[];
  hidePicFilter?: boolean;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onPicChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onFollowUpFilterChange: (v: string) => void;
}

export function FilterBar({
  startDate,
  endDate,
  picId,
  status,
  search,
  followUpFilter,
  pics,
  hidePicFilter = false,
  onStartDateChange,
  onEndDateChange,
  onPicChange,
  onStatusChange,
  onSearchChange,
  onFollowUpFilterChange,
}: FilterBarProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters =
    startDate || endDate || (!hidePicFilter && picId) || status || followUpFilter !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder={sf.searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-10 w-full text-sm"
            style={{ minHeight: "40px" }}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "btn-secondary flex items-center gap-2 text-sm whitespace-nowrap",
            hasActiveFilters && "btn-primary-solid"
          )}
        >
          <Filter className="size-4" />
          {sf.filter}
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-white/20 text-xs font-bold">
              !
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="surface-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
              {sf.startDate}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="input-field w-full text-sm"
              style={{ minHeight: "40px" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
              {sf.endDate}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="input-field w-full text-sm"
              style={{ minHeight: "40px" }}
            />
          </div>
          {!hidePicFilter && (
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
                {sf.colPic}
              </label>
              <select
                value={picId}
                onChange={(e) => onPicChange(e.target.value)}
                className="input-field w-full text-sm"
                style={{ minHeight: "40px" }}
              >
                <option value="">{sf.allPics}</option>
                {pics.map((pic) => (
                  <option key={pic.id} value={pic.id}>
                    {pic.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
              {sf.leadStatus}
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="input-field w-full text-sm"
              style={{ minHeight: "40px" }}
            >
              <option value="">{sf.allStatuses}</option>
              {getLeadStatusOptions(sf).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
              {sf.followUpStatus}
            </label>
            <div className="flex flex-wrap gap-2">
              {getFollowUpFilterOptions(sf).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFollowUpFilterChange(opt.value)}
                  className={cn(
                    "filter-pill text-xs px-3 py-1.5 rounded-full font-medium transition",
                    followUpFilter === opt.value
                      ? "filter-pill-active"
                      : "bg-[var(--surface-muted)] hover:bg-[var(--border-color)]"
                  )}
                  style={followUpFilter !== opt.value ? { color: "var(--text-secondary)" } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={() => {
                  onStartDateChange("");
                  onEndDateChange("");
                  onPicChange("");
                  onStatusChange("");
                  onSearchChange("");
                  onFollowUpFilterChange("all");
                }}
                className="text-xs font-medium underline"
                style={{ color: "var(--text-muted)" }}
              >
                {sf.resetFilters}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
