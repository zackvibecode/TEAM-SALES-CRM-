"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

type ResetScope = "duplicates" | "all" | "page";

interface RotatorResetClicksProps {
  pageId?: string;
  pageName?: string;
  onReset?: () => void;
  compact?: boolean;
}

export function RotatorResetClicks({
  pageId,
  pageName,
  onReset,
  compact,
}: RotatorResetClicksProps) {
  const [loading, setLoading] = useState<ResetScope | null>(null);

  const resetClicks = async (scope: ResetScope) => {
    const labels: Record<ResetScope, string> = {
      duplicates: "semua DUPLICATE clicks",
      all: "SEMUA click analytics rotator",
      page: `semua clicks untuk page "${pageName || "ini"}"`,
    };

    const msg =
      scope === "all"
        ? `Reset ${labels.all}? Statistik akan jadi 0. Tindakan ini tidak boleh dibatalkan.`
        : `Padam ${labels[scope]}? Tindakan ini tidak boleh dibatalkan.`;

    if (!confirm(msg)) return;

    setLoading(scope);
    try {
      const res = await fetch("/api/admin/rotator/reset-clicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, ...(pageId ? { pageId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      alert(`Berjaya reset. ${data.deleted ?? 0} rekod dipadam.`);
      onReset?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(null);
    }
  };

  if (compact && pageId) {
    return (
      <button
        type="button"
        onClick={() => resetClicks("page")}
        disabled={!!loading}
        className="btn-ghost text-xs py-1 px-2 text-amber-700 inline-flex items-center gap-1"
        title="Reset clicks for this page"
      >
        <RotateCcw className={`w-3 h-3 ${loading === "page" ? "animate-spin" : ""}`} />
        Reset Clicks
      </button>
    );
  }

  return (
    <div
      className="card-padded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div>
        <p className="text-sm font-semibold">Reset Click Analytics</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Admin sahaja. Padam duplicate atau reset semua statistik klik rotator.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => resetClicks("duplicates")}
          disabled={!!loading}
          className="btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading === "duplicates" ? "animate-spin" : ""}`} />
          Reset Duplicates
        </button>
        <button
          type="button"
          onClick={() => resetClicks("all")}
          disabled={!!loading}
          className="btn-ghost text-xs text-red-600 inline-flex items-center gap-1.5 border border-red-200"
        >
          <Trash2 className={`w-3.5 h-3.5 ${loading === "all" ? "animate-spin" : ""}`} />
          Reset All Clicks
        </button>
      </div>
    </div>
  );
}
