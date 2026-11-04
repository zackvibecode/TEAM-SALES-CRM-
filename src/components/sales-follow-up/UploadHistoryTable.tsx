"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

export interface UploadBatchRow {
  id: string;
  batchName: string;
  fileName: string;
  assignMode: string;
  uploadedBy: string;
  createdAt: string;
  totalLeads: number;
  completedLeads: number;
  pendingLeads: number;
  status: "Complete" | "In Progress";
}

interface UploadHistoryTableProps {
  batches: UploadBatchRow[];
  loading: boolean;
  showUploader?: boolean;
}

function Th({
  children,
  align,
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${className}`}
      style={{
        color: "var(--text-muted)",
        textAlign: align || "left",
      }}
    >
      {children}
    </th>
  );
}

export function UploadHistoryTable({ batches, loading, showUploader = false }: UploadHistoryTableProps) {
  const { t, locale } = useAppLocale();
  void t;

  if (loading) {
    return (
      <div className="surface-card rounded-xl p-8 text-center">
        <Loader2 className="size-6 mx-auto animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="surface-card rounded-xl p-8 text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {locale === "bm" ? "Belum ada upload" : "No uploads yet"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {locale === "bm"
            ? "Setiap kali upload Excel, batch akan muncul di sini."
            : "Each Excel upload will appear here as a batch."}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {locale === "bm" ? "Sejarah Upload" : "Upload History"}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-muted)" }}>
              {showUploader && (
                <Th align="left">{locale === "bm" ? "Sales" : "Sales"}</Th>
              )}
              <Th align="left">{locale === "bm" ? "Batch" : "Batch"}</Th>
              <Th align="left">{locale === "bm" ? "Tarikh" : "Date"}</Th>
              <Th align="center">{locale === "bm" ? "Leads" : "Leads"}</Th>
              <Th align="left" className="w-56">
                {locale === "bm" ? "Progress" : "Progress"}
              </Th>
              <Th align="center">{locale === "bm" ? "Status" : "Status"}</Th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const pct = b.totalLeads > 0 ? Math.round((b.completedLeads / b.totalLeads) * 100) : 0;
              const isDone = b.status === "Complete";
              return (
                <tr key={b.id} className="table-row">
                  {showUploader && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                        {b.uploadedBy || "-"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold truncate max-w-[220px]" style={{ color: "var(--text-primary)" }}>
                      {b.batchName}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate max-w-[220px]" style={{ color: "var(--text-muted)" }}>
                      {b.fileName}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>
                    {new Date(b.createdAt).toLocaleDateString(locale === "bm" ? "ms-MY" : "en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {b.totalLeads}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--surface-muted)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isDone
                              ? "var(--color-success-500, #22c55e)"
                              : "var(--color-primary-500, #3b82f6)",
                          }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {b.completedLeads}/{b.totalLeads}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isDone ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-success-500, #22c55e) 12%, transparent)",
                          color: "var(--color-success-600, #16a34a)",
                        }}
                      >
                        <CheckCircle2 className="size-3" />
                        {locale === "bm" ? "Selesai" : "Complete"}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: "var(--surface-muted)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Loader2 className="size-3 animate-spin" />
                        {pct}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
