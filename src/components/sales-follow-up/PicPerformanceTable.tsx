"use client";

import { ArrowUpDown, Download, Printer } from "lucide-react";
import type { PicPerformanceRow } from "@/lib/sales-follow-up/types";

interface PicPerformanceTableProps {
  data: PicPerformanceRow[];
  onExportCsv: () => void;
}

export function PicPerformanceTable({ data, onExportCsv }: PicPerformanceTableProps) {
  if (data.length === 0) {
    return (
      <div
        className="surface-card rounded-xl p-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <p className="text-sm font-medium">Tiada data prestasi untuk dipaparkan.</p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          Laporan Prestasi PIC
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <Download className="size-3.5" />
            Export Lead (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <Printer className="size-3.5" />
            Cetak
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-muted)" }}>
              <Th>PIC</Th>
              <Th align="right">Lead</Th>
              <Th align="right">Aktiviti FU</Th>
              <Th align="right">Difollow-Up</Th>
              <Th align="right">Min 3x FU</Th>
              <Th align="right">Belum FU</Th>
              <Th align="right">Overdue</Th>
              <Th align="right">Kadar Selesai</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.pic_id}
                className="table-row"
              >
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
                  <span className={row.no_follow_up > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}>
                    {row.no_follow_up}
                  </span>
                </Td>
                <Td align="right">
                  <span className={row.overdue > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-green-600 dark:text-green-400"}>
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
                          backgroundColor: row.completion_rate >= 50
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
      className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{
        color: "var(--text-muted)",
        textAlign: align || "left",
      }}
    >
      <div className="flex items-center gap-1" style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
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
