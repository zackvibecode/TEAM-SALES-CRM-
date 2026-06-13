"use client";

import { useCallback, useEffect, useState } from "react";
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

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const handleDownload = async () => {
    if (!src) return;
    setDownloading(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = posterFilename(title, src);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(src, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

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
        onClick={() => setOpen(true)}
        className={`${thumbnailClassName} group cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b66ff]`}
        aria-label={t.promo.viewFullPoster}
      >
        <Image src={src} alt={title} fill className="object-cover" unoptimized />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold truncate" style={{ color: "#fff" }}>
                {title}
              </h3>
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
                  onClick={close}
                  className="p-2 rounded-lg bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 transition"
                  aria-label={t.promo.closeViewer}
                >
                  <X className="w-4 h-4 text-slate-900" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-square max-w-lg mx-auto w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={title}
                className="w-full h-full object-contain mx-auto block"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
