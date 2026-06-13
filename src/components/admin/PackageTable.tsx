"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Pencil,
  Copy,
  MoreVertical,
  Trash2,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Promo, PromoDepartureEntry } from "@/types/promo";

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "departure" | "updated" | "title" | "seats";

interface PackageTableProps {
  promos: Promo[];
  basePath: string;
  onDelete: (id: string) => void;
}

const actionBtnClass =
  "inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-md border text-[11px] font-medium transition-all duration-150 hover:bg-[var(--surface-hover)] active:scale-[0.96] active:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b66ff]/35";

function normalizeDepartures(promo: Promo): PromoDepartureEntry[] {
  if (!Array.isArray(promo.departure_dates)) return [];
  return promo.departure_dates.map((entry) =>
    typeof entry === "string" ? { name: "", date: entry } : entry
  );
}

function sortedDepartures(promo: Promo): PromoDepartureEntry[] {
  return normalizeDepartures(promo)
    .filter((d) => d.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function earliestDepartureMs(promo: Promo): number {
  const sorted = sortedDepartures(promo);
  return sorted.length > 0 ? new Date(sorted[0].date).getTime() : Number.MAX_SAFE_INTEGER;
}

function packageCode(promo: Promo): string {
  const d = promo.created_at ? new Date(promo.created_at) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const short = promo.id.replace(/-/g, "").slice(0, 3).toUpperCase();
  return `PKG-${y}-${m}-${short}`;
}

function destinationNames(promo: Promo): string[] {
  if (promo.destination?.trim()) return [promo.destination.trim()];
  const names = normalizeDepartures(promo)
    .map((e) => e.name?.trim())
    .filter(Boolean) as string[];
  return [...new Set(names)];
}

function destinationLabel(promo: Promo): string {
  const names = destinationNames(promo);
  if (names.length > 0) return names.join(" · ");
  return promo.title || "-";
}

function packageTitle(promo: Promo): string {
  const first = normalizeDepartures(promo).find((e) => e.name)?.name;
  return (first || promo.title || "Package").toUpperCase();
}

function BluePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none"
      style={{
        background: "rgba(59, 102, 255, 0.12)",
        color: "#3b66ff",
        border: "1px solid rgba(59, 102, 255, 0.25)",
      }}
    >
      {children}
    </span>
  );
}

export function PackageTable({ promos, basePath, onDelete }: PackageTableProps) {
  const router = useRouter();
  const { t, locale } = useAppLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("departure");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const maxSeats = useMemo(
    () => Math.max(1, ...promos.map((p) => p.seats_left ?? 0)),
    [promos]
  );

  const filtered = useMemo(() => {
    let rows = [...promos];

    if (statusFilter === "active") rows = rows.filter((p) => p.is_active);
    if (statusFilter === "inactive") rows = rows.filter((p) => !p.is_active);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => {
        const haystack = [
          p.title,
          p.destination,
          destinationLabel(p),
          packageTitle(p),
          packageCode(p),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    rows.sort((a, b) => {
      if (sortKey === "departure") {
        return earliestDepartureMs(a) - earliestDepartureMs(b);
      }
      if (sortKey === "title") {
        return packageTitle(a).localeCompare(packageTitle(b));
      }
      if (sortKey === "seats") {
        return (b.seats_left ?? 0) - (a.seats_left ?? 0);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return rows;
  }, [promos, search, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.common.all },
    { key: "active", label: t.common.active },
    { key: "inactive", label: t.common.inactive },
  ];

  const handleDelete = async (promo: Promo) => {
    if (!window.confirm(t.admin.packages.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/promos?id=${promo.id}`, { method: "DELETE" });
      if (res.ok) onDelete(promo.id);
    } catch {
      // ignore
    }
    setMenuOpenId(null);
  };

  const handleDuplicate = async (promo: Promo) => {
    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${promo.title} (Copy)`,
          promo_text: promo.promo_text,
          poster_url: promo.poster_url,
          image_url: promo.image_url,
          destination: promo.destination,
          seats_left: promo.seats_left ?? 0,
          departure_dates: normalizeDepartures(promo),
          is_active: false,
          sort_order: promo.sort_order ?? 0,
        }),
      });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="surface-card rounded-xl p-3 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.admin.packages.searchPackages}
              className="input-field pl-8 w-full text-xs py-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
              {t.admin.packages.sortBy}
            </label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="input-field text-xs py-1.5 min-w-[130px]"
            >
              <option value="departure">{t.admin.packages.earliestDeparture}</option>
              <option value="updated">{t.admin.packages.latestUpdated}</option>
              <option value="title">{t.admin.packages.sortName}</option>
              <option value="seats">{t.admin.packages.seatLeft}</option>
            </select>
            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="text-[11px] font-medium hover:underline active:opacity-70"
                style={{ color: "#ef4444" }}
              >
                {t.admin.packages.clearFilters}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border active:scale-[0.97]",
                statusFilter === tab.key
                  ? "border-[#ef4444] text-[#ef4444] bg-[rgba(239,68,68,0.08)]"
                  : "hover:bg-[var(--surface-hover)]"
              )}
              style={
                statusFilter === tab.key
                  ? undefined
                  : { color: "var(--text-secondary)", borderColor: "var(--border-color)" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[880px]">
            <thead>
              <tr className="table-head">
                <th className="table-th !text-[10px] !py-2.5">{t.admin.packages.packageCol}</th>
                <th className="table-th !text-[10px] !py-2.5">{t.admin.packages.destination}</th>
                <th className="table-th !text-[10px] !py-2.5">{t.admin.packages.departureDate}</th>
                <th className="table-th !text-[10px] !py-2.5">{t.admin.packages.seatLeft}</th>
                <th className="table-th !text-[10px] !py-2.5">{t.common.status}</th>
                <th className="table-th !text-[10px] !py-2.5">{t.admin.packages.updatedCol}</th>
                <th className="table-th !text-[10px] !py-2.5 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                paginated.map((promo) => {
                  const imageSrc = promo.image_url || promo.poster_url;
                  const departures = sortedDepartures(promo);
                  const destNames = destinationNames(promo);
                  const hasMultipleDates = departures.length > 1;
                  const hasMultiplePackages = destNames.length > 1;
                  const seats = promo.seats_left ?? 0;
                  const seatPct = Math.min(100, Math.round((seats / maxSeats) * 100));

                  return (
                    <tr key={promo.id} className="table-row align-top">
                      {/* Package */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-2.5 min-w-[200px]">
                          <div
                            className="w-11 h-11 rounded-md overflow-hidden shrink-0 border"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--surface-muted)",
                            }}
                          >
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={packageTitle(promo)}
                                className="w-full h-full object-cover aspect-square"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p
                              className="font-semibold text-[11px] truncate uppercase tracking-wide leading-tight"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {packageTitle(promo)}
                            </p>
                            <p className="text-[10px] truncate leading-tight" style={{ color: "var(--text-muted)" }}>
                              {packageCode(promo)}
                            </p>
                            {hasMultiplePackages && (
                              <BluePill>
                                {t.admin.packages.multiplePackages} · {destNames.length}
                              </BluePill>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-3 py-2.5 max-w-[160px]">
                        <div className="space-y-1">
                          <p
                            className="text-[11px] leading-snug line-clamp-2"
                            style={{ color: "var(--text-secondary)" }}
                            title={destinationLabel(promo)}
                          >
                            {destinationLabel(promo)}
                          </p>
                          {hasMultiplePackages && (
                            <BluePill>{t.admin.packages.multiplePackages}</BluePill>
                          )}
                        </div>
                      </td>

                      {/* Departure dates — earliest first */}
                      <td className="px-3 py-2.5 min-w-[130px]">
                        {departures.length > 0 ? (
                          <div className="space-y-1">
                            {hasMultipleDates && (
                              <BluePill>
                                {t.admin.packages.multipleDates} · {departures.length}
                              </BluePill>
                            )}
                            {departures.slice(0, 4).map((entry, idx) => (
                              <div key={`${entry.date}-${idx}`} className="leading-tight">
                                <p
                                  className={cn(
                                    "tabular-nums",
                                    idx === 0
                                      ? "text-[12px] font-bold"
                                      : "text-[10px] font-medium"
                                  )}
                                  style={{
                                    color: idx === 0 ? "var(--text-primary)" : "var(--text-muted)",
                                  }}
                                >
                                  {formatDate(entry.date, locale)}
                                </p>
                                {entry.name && (
                                  <p className="text-[10px] truncate max-w-[120px]" style={{ color: "var(--text-muted)" }}>
                                    {entry.name}
                                  </p>
                                )}
                              </div>
                            ))}
                            {departures.length > 4 && (
                              <p className="text-[10px] font-medium" style={{ color: "#3b66ff" }}>
                                +{departures.length - 4} {t.admin.packages.moreDates}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            -
                          </span>
                        )}
                      </td>

                      {/* Seats */}
                      <td className="px-3 py-2.5 min-w-[100px]">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                            {seats} {t.admin.packages.seatsUnit}
                          </p>
                          <div
                            className="h-1 rounded-full overflow-hidden w-full max-w-[80px]"
                            style={{ background: "var(--surface-muted)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${seatPct}%`, background: "#ef4444" }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: promo.is_active
                              ? "rgba(16, 185, 129, 0.12)"
                              : "var(--surface-muted)",
                            color: promo.is_active ? "#10b981" : "var(--text-muted)",
                          }}
                        >
                          {promo.is_active ? t.common.active : t.common.inactive}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
                          {formatDateTime(promo.updated_at, locale)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1 relative">
                          <div
                            className="inline-flex items-center gap-1 rounded-lg p-0.5"
                            style={{
                              background: "var(--surface-muted)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => router.push(`${basePath}/${promo.id}/edit`)}
                              className={actionBtnClass}
                              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                              title={t.common.edit}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(promo)}
                              className={actionBtnClass}
                              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                              title={t.admin.packages.duplicate}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpenId(menuOpenId === promo.id ? null : promo.id)
                              }
                              className={actionBtnClass}
                              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                              title={t.common.actions}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {menuOpenId === promo.id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-20 min-w-[108px] rounded-lg border py-1 shadow-lg"
                              style={{
                                background: "var(--surface-card)",
                                borderColor: "var(--border-color)",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleDelete(promo)}
                                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-muted)]"
                                style={{ color: "#ef4444" }}
                              >
                                <Trash2 className="w-3 h-3" />
                                {t.common.delete}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          <p>
            {t.admin.packages.showing
              .replace("{from}", String(start + 1))
              .replace("{to}", String(Math.min(start + pageSize, filtered.length)))
              .replace("{total}", String(filtered.length))}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md border disabled:opacity-40 hover:bg-[var(--surface-hover)] active:scale-95"
              style={{ borderColor: "var(--border-color)" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  "min-w-[28px] h-7 rounded-md text-[11px] font-semibold border transition active:scale-95",
                  safePage === n
                    ? "border-[#ef4444] text-[#ef4444] bg-[rgba(239,68,68,0.08)]"
                    : "hover:bg-[var(--surface-hover)]"
                )}
                style={
                  safePage === n
                    ? undefined
                    : { borderColor: "var(--border-color)", color: "var(--text-secondary)" }
                }
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md border disabled:opacity-40 hover:bg-[var(--surface-hover)] active:scale-95"
              style={{ borderColor: "var(--border-color)" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="input-field text-[11px] py-1 w-auto"
          >
            <option value={6}>6 {t.admin.packages.perPage}</option>
            <option value={10}>10 {t.admin.packages.perPage}</option>
            <option value={20}>20 {t.admin.packages.perPage}</option>
          </select>
        </div>
      )}
    </div>
  );
}
