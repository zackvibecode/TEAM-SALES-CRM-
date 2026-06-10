"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { RotatorLandingPreview } from "./RotatorLandingPreview";
import { RotatorLinkActions } from "./RotatorLinkActions";
import { DEFAULT_LOADING_TEXT, normalizeImageSize, type RotatorImageSize } from "@/lib/rotator/display";
import { getRotatorPreviewPath, getRotatorPublicPath } from "@/lib/rotator/urls";

interface RotatorPreviewModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  slug: string;
  imageUrl?: string | null;
  loadingText?: string;
  imageSize?: RotatorImageSize | string | null;
}

export function RotatorPreviewModal({
  open,
  onClose,
  name,
  slug,
  imageUrl,
  loadingText = DEFAULT_LOADING_TEXT,
  imageSize = "large",
}: RotatorPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const previewPath = getRotatorPreviewPath(slug);
  const livePath = getRotatorPublicPath(slug);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="surface-card w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-base">{name}</h3>
            <p className="text-xs mt-1 font-mono break-all" style={{ color: "var(--text-muted)" }}>
              Preview: {previewPath} · Live: {livePath}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost p-1.5 shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--border-color)", background: "var(--surface-hover)" }}>
          <RotatorLandingPreview
            imageUrl={imageUrl ?? null}
            loadingText={loadingText}
            imageSize={normalizeImageSize(imageSize)}
            slug={slug}
            showLabel={false}
            showLinkActions={false}
          />
        </div>

        <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Buka preview untuk test rotation & butang WhatsApp sebenar.
        </p>

        <RotatorLinkActions slug={slug} layout="stack" />

        <button type="button" onClick={onClose} className="btn-ghost text-sm w-full">
          Tutup
        </button>
      </div>
    </div>
  );
}
