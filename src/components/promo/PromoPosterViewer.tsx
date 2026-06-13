"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Download, X, ZoomIn } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

function posterFilename(title: string, url: string) {
  const ext = url.split(".").pop()?.split("?")[0] || "jpg";
  const safe = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "poster";
  return `${safe}.${ext}`;
}

interface PromoPosterViewerProps {
  src: string | null;
  title: string;
  thumbnailClassName?: string;
  placeholder?: React.ReactNode;
}

export function PromoPosterViewer({
  src,
  title,
  thumbnailClassName = "relative size-24 shrink-0 aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-white",
  placeholder,
}: PromoPosterViewerProps) {
  const { t } = useAppLocale();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, close]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!src || downloading) return;

    setDownloading(true);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);

      const res = await fetch(src, { signal: controller.signal, mode: "cors" });
      window.clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = posterFilename(title, src);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const a = document.createElement("a");
      a.href = src;
      a.download = posterFilename(title, src);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  };

  const openViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  const lightbox =
    open && src ? (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="relative w-full max-w-lg flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold truncate text-white">{title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? t.common.saving : t.promo.downloadPoster}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                }}
                className="p-2 rounded-lg bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 transition"
                aria-label={t.promo.closeViewer}
              >
                <X className="w-4 h-4 text-slate-900" />
              </button>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-lg mx-auto rounded-xl overflow-hidden bg-black/50 border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={title} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    ) : null;

  if (!src) {
    return (
      <div className={thumbnailClassName}>
        {placeholder ?? (
          <div
            className="absolute inset-0 flex items-center justify-center text-[10px] text-center px-1"
            style={{ color: "var(--text-muted)" }}
          >
            {t.promo.poster}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        className={`${thumbnailClassName} group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b66ff]`}
        aria-label={t.promo.viewFullPoster}
      >
        <Image src={src} alt={title} fill className="object-cover" unoptimized />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors pointer-events-none">
          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </span>
      </button>

      {mounted && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
