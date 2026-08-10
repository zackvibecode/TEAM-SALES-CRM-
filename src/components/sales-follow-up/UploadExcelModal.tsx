"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { X, Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SalesPic } from "@/lib/sales-follow-up/types";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { sfReplace } from "@/lib/i18n/en/salesFollowUp";
import { mapSalesFollowUpApiError } from "@/lib/sales-follow-up/api-error";

interface UploadExcelModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (summary: {
    inserted: number;
    skippedDuplicate: number;
    skippedOwnedByOther?: number;
    skippedInvalid: number;
    totalParsed: number;
    fileName: string;
  }) => void;
  pics: SalesPic[];
  lockPic?: boolean;
}

export function UploadExcelModal({
  open,
  onClose,
  onSuccess,
  pics,
  lockPic = false,
}: UploadExcelModalProps) {
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [picId, setPicId] = useState(lockPic && pics[0]?.id ? pics[0].id : "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError(sf.fileRequired);
      return;
    }

    const targetPicId = lockPic ? pics[0]?.id : picId;
    if (!lockPic && !targetPicId) {
      setError(sf.assignToPicRequired);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (targetPicId) form.append("picId", targetPicId);

      const res = await fetch("/api/sales-follow-up/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(mapSalesFollowUpApiError(sf, data, "uploadFail"));
      }

      onSuccess({
        inserted: data.inserted ?? 0,
        skippedDuplicate: data.skippedDuplicate ?? 0,
        skippedOwnedByOther: data.skippedOwnedByOther ?? 0,
        skippedInvalid: data.skippedInvalid ?? 0,
        totalParsed: data.totalParsed ?? 0,
        fileName: data.fileName || file.name,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : sf.uploadFail);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 surface-card rounded-2xl w-full max-w-md mx-4 shadow-2xl"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b rounded-t-2xl"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {sf.uploadTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {sf.uploadSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                backgroundColor: "var(--color-error-50, #fef2f2)",
                color: "var(--color-error-600, #dc2626)",
              }}
            >
              {error}
            </div>
          )}

          {!lockPic && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                {sf.assignToPic} <span style={{ color: "var(--color-error-500)" }}>*</span>
              </label>
              <select
                value={picId}
                onChange={(e) => setPicId(e.target.value)}
                className="input-field w-full text-sm"
                required
              >
                <option value="">{sf.selectPic}</option>
                {pics.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {lockPic && pics[0] && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sfReplace(sf.assignHint, { name: pics[0].name })}
            </p>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              {sf.fileLabel}
            </label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-xl border border-dashed px-4 py-8 text-center transition hover:bg-[var(--surface-muted)]"
              style={{ borderColor: "var(--border-color)" }}
            >
              <FileSpreadsheet
                className="size-8 mx-auto mb-2 opacity-60"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {file ? file.name : sf.pickFile}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                {sf.fileHint}
              </p>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={uploading}>
              {sf.cancel}
            </button>
            <button
              type="submit"
              className={cn(
                "btn-primary-solid flex-1 flex items-center justify-center gap-2",
                uploading && "opacity-70"
              )}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {sf.uploadBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
