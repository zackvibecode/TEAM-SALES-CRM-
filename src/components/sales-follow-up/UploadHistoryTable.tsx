"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Pencil, Trash2, Check, X } from "lucide-react";
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
  isAdmin?: boolean;
  /** Dipanggil selepas rename/delete supaya parent refresh senarai */
  onChanged?: () => void;
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

export function UploadHistoryTable({
  batches,
  loading,
  showUploader = false,
  isAdmin = false,
  onChanged,
}: UploadHistoryTableProps) {
  const { locale } = useAppLocale();
  const bm = locale === "bm";

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function saveRename(id: string) {
    const name = renameValue.trim();
    if (!name || renameBusy) return;
    setRenameBusy(true);
    try {
      const res = await fetch(`/api/sales-follow-up/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName: name }),
      });
      if (!res.ok) throw new Error();
      setRenamingId(null);
      onChanged?.();
    } catch {
      // keep editing on failure
    } finally {
      setRenameBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/sales-follow-up/batches/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeleteId(null);
      onChanged?.();
    } catch {
      // stay on confirm
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="surface-card rounded-xl p-8 text-center">
        <Loader2 className="size-6 mx-auto animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="surface-card rounded-xl p-6 text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {bm ? "Belum ada upload" : "No uploads yet"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {bm
            ? "Setiap kali upload Excel, batch akan muncul di sini."
            : "Each Excel upload will appear here as a batch."}
        </p>
      </div>
    );
  }

  const deletingBatch = batches.find((b) => b.id === deleteId);

  return (
    <>
      <div className="surface-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {bm ? "Sejarah Upload (Batch)" : "Upload History (Batches)"}
          </h3>
          <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
            {batches.length} {bm ? "batch" : "batches"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--surface-muted)" }}>
                {showUploader && (
                  <Th align="left">{bm ? "Sales" : "Sales"}</Th>
                )}
                <Th align="left">{bm ? "Batch" : "Batch"}</Th>
                <Th align="left">{bm ? "Tarikh" : "Date"}</Th>
                <Th align="center">{bm ? "Leads" : "Leads"}</Th>
                <Th align="left" className="w-48">
                  {bm ? "Progress" : "Progress"}
                </Th>
                <Th align="center">{bm ? "Status" : "Status"}</Th>
                {isAdmin && <Th align="center">{bm ? "Tindakan" : "Actions"}</Th>}
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const pct = b.totalLeads > 0 ? Math.round((b.completedLeads / b.totalLeads) * 100) : 0;
                const isDone = b.status === "Complete";
                const isRenaming = renamingId === b.id;
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
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveRename(b.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="input-field text-xs py-1 min-w-0 w-40"
                            style={{ minHeight: "30px" }}
                          />
                          <button
                            type="button"
                            disabled={renameBusy}
                            onClick={() => void saveRename(b.id)}
                            className="inline-flex items-center justify-center size-7 rounded-lg btn-primary-solid shrink-0"
                            title={bm ? "Simpan" : "Save"}
                          >
                            {renameBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingId(null)}
                            className="inline-flex items-center justify-center size-7 rounded-lg border shrink-0"
                            style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                            title={bm ? "Batal" : "Cancel"}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            className="text-sm font-semibold truncate max-w-[220px]"
                            title={b.batchName}
                            style={{ color: "var(--text-primary)" }}
                          >
                            {b.batchName}
                          </p>
                          <p className="text-[11px] mt-0.5 truncate max-w-[220px]" title={b.fileName} style={{ color: "var(--text-muted)" }}>
                            {b.fileName}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>
                      {new Date(b.createdAt).toLocaleDateString(bm ? "ms-MY" : "en-MY", {
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
                            className="h-full rounded-full transition-all duration-500"
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
                          {bm ? "Selesai" : "Complete"}
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
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingId(b.id);
                              setRenameValue(b.batchName);
                            }}
                            className="inline-flex items-center justify-center size-8 rounded-lg border transition shrink-0"
                            style={{
                              borderColor: "var(--border-color)",
                              color: "var(--text-secondary)",
                              backgroundColor: "var(--surface-muted)",
                            }}
                            title={bm ? "Rename batch" : "Rename batch"}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(b.id)}
                            className="inline-flex items-center justify-center size-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition shrink-0"
                            style={{ color: "#dc2626" }}
                            title={bm ? "Padam batch (leads kekal)" : "Delete batch (leads kept)"}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && deletingBatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !deleteBusy && setDeleteId(null)}
        >
          <div
            className="surface-card rounded-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {bm ? "Padam batch ini?" : "Delete this batch?"}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {bm ? "Rekod batch" : "Batch record"} <strong>{deletingBatch.batchName}</strong>{" "}
              {bm
                ? "sahaja akan dipadam. Semua leads kekal dalam sistem."
                : "will be deleted only. All leads stay in the system."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteId(null)}
                className="btn-secondary text-sm"
              >
                {bm ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDelete()}
                className="btn-primary-solid text-sm"
                style={{ backgroundColor: "#dc2626" }}
              >
                {deleteBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {bm ? "Padam" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
