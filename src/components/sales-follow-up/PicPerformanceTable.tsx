"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Download, Printer, ChevronDown } from "lucide-react";
import type { PicPerformanceRow } from "@/lib/sales-follow-up/types";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

interface PicPerformanceTableProps {
  data: PicPerformanceRow[];
  onExportCsv: () => void;
  onExportPerfCsv?: () => void;
  onExportFollowUpReport?: () => void;
}

export function PicPerformanceTable({
  data,
  onExportCsv,
  onExportPerfCsv,
  onExportFollowUpReport,
}: PicPerformanceTableProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const [showExports, setShowExports] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExports) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExports(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showExports]);

  if (data.length === 0) {
    return (
      <div
        className="surface-card rounded-xl p-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-sm font-medium">{sf.perfEmpty}</p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b gap-2 flex-wrap"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {sf.perfTitle}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowExports((v) => !v)}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
              aria-expanded={showExports}
              aria-haspopup="menu"
            >
              <Download className="size-3.5" />
              {sf.exportCsv}
              <ChevronDown className="size-3.5" />
            </button>
            {showExports && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border shadow-lg py-1.5"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--surface-card)",
                }}
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setShowExports(false);
                    onExportCsv();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-[var(--surface-muted)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {sf.exportCsv}
                </button>
                {onExportPerfCsv && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowExports(false);
                      onExportPerfCsv();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-[var(--surface-muted)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {sf.exportPerfCsv}
                  </button>
                )}
                {onExportFollowUpReport && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowExports(false);
                      onExportFollowUpReport();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
                    style={{ color: "var(--color-primary-600, #1d4ed8)" }}
                  >
                    Follow-Up Report
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            title={sf.print}
          >
            <Printer className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-muted)" }}>
              <Th>{sf.colPic}</Th>
              <Th align="right">{sf.colLead}</Th>
              <Th align="right">{sf.colFuActivities}</Th>
              <Th align="right">{sf.colFollowedUp}</Th>
              <Th align="right">{sf.colMin3x}</Th>
              <Th align="right">{sf.colNoFu}</Th>
              <Th align="right">{sf.colOverdue}</Th>
              <Th align="right">{sf.colCompletion}</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.pic_id} className="table-row">
                <Td>
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {row.pic_name}
                  </span>
                </Td>
                <Td align="right">{row.leads_assigned}</Td>
                <Td align="right">
                  <span className="font-semibold tabular-nums">{row.total_follow_up_activities}</span>
                </Td>
                <Td align="right">{row.leads_followed_up}</Td>
                <Td align="right">
                  <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    {row.leads_with_three_plus}
                  </span>
                </Td>
                <Td align="right">
                  <span
                    className={
                      row.no_follow_up > 0
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {row.no_follow_up}
                  </span>
                </Td>
                <Td align="right">
                  <span
                    className={
                      row.overdue > 0
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    {row.overdue}
                  </span>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(row.completion_rate, 100)}%`,
                          backgroundColor:
                            row.completion_rate >= 50
                              ? "var(--color-success-500, #22c55e)"
                              : row.completion_rate >= 30
                                ? "var(--color-warning-500, #f59e0b)"
                                : "var(--color-error-500, #ef4444)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-12 text-right">
                      {row.completion_rate}%
                    </span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className="px-4 py-3 text-xs font-semibold whitespace-nowrap"
      style={{
        color: "var(--text-muted)",
        textAlign: align || "left",
      }}
    >
      <div
        className="flex items-center gap-1"
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
      >
        {children}
        <ArrowUpDown className="size-3 opacity-40" />
      </div>
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td
      className="px-4 py-3 text-sm tabular-nums whitespace-nowrap"
      style={{
        color: "var(--text-secondary)",
        textAlign: align || "left",
      }}
    >
      {children}
    </td>
  );
}
