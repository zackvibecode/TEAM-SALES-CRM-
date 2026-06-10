"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRotatorPreviewPath,
  getRotatorPublicPath,
  getRotatorPublicUrl,
  isRotatorSlugReady,
} from "@/lib/rotator/urls";

interface RotatorLinkActionsProps {
  slug: string;
  layout?: "inline" | "stack";
  size?: "sm" | "md";
  showCopy?: boolean;
  className?: string;
}

/** Open preview / live rotator links from admin UI */
export function RotatorLinkActions({
  slug,
  layout = "inline",
  size = "md",
  showCopy = true,
  className,
}: RotatorLinkActionsProps) {
  const [copied, setCopied] = useState(false);
  const ready = isRotatorSlugReady(slug);
  const previewPath = getRotatorPreviewPath(slug);
  const livePath = getRotatorPublicPath(slug);

  const btnClass = size === "sm" ? "text-xs py-1.5 px-2.5" : "text-sm py-2 px-3";

  const copyLiveLink = async () => {
    if (!ready) return;
    await navigator.clipboard.writeText(getRotatorPublicUrl(slug));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!ready) {
    return (
      <p className={cn("text-xs", className)} style={{ color: "var(--text-muted)" }}>
        Simpan page dulu untuk buka link.
      </p>
    );
  }

  return (
    <div
      className={cn(
        layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2",
        className
      )}
    >
      <a
        href={previewPath}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("btn-primary-solid inline-flex items-center justify-center gap-2", btnClass)}
      >
        <Eye className="w-4 h-4 shrink-0" />
        Buka Preview
      </a>

      <a
        href={livePath}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("btn-secondary inline-flex items-center justify-center gap-2", btnClass)}
      >
        <ExternalLink className="w-4 h-4 shrink-0" />
        Buka Link Live
      </a>

      {showCopy && (
        <button
          type="button"
          onClick={copyLiveLink}
          className={cn("btn-ghost inline-flex items-center justify-center gap-2", btnClass)}
        >
          {copied ? <Check className="w-4 h-4 shrink-0 text-emerald-600" /> : <Copy className="w-4 h-4 shrink-0" />}
          {copied ? "Disalin" : "Copy Link Live"}
        </button>
      )}
    </div>
  );
}
