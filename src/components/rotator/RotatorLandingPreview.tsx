"use client";

import Image from "next/image";
import { Smartphone } from "lucide-react";
import {
  getRotatorFrameClass,
  getRotatorImageClass,
  type RotatorImageSize,
} from "@/lib/rotator/display";
import { RotatorPhoneFrame } from "./RotatorPhoneFrame";
import { RotatorContentFrame } from "./RotatorContentFrame";
import { RotatorSceneBackground } from "./RotatorSceneBackground";
import { RotatorLinkActions } from "./RotatorLinkActions";
import { RotatorCountdownRing } from "./RotatorCountdownRing";

interface RotatorLandingPreviewProps {
  imageUrl: string | null;
  loadingText: string;
  imageSize: RotatorImageSize;
  slug?: string;
  countdown?: number;
  compact?: boolean;
  showLabel?: boolean;
  showLinkActions?: boolean;
  linksEnabled?: boolean;
}

/** Mobile-style live preview with curved phone frame & scenic layout */
export function RotatorLandingPreview({
  imageUrl,
  loadingText,
  imageSize,
  slug,
  countdown = 2,
  compact,
  showLabel = true,
  showLinkActions = true,
  linksEnabled = true,
}: RotatorLandingPreviewProps) {
  const displayUrl = imageUrl || "/default-rotator-preview.jpg";
  const imageClass = getRotatorImageClass(imageSize);

  const screenContent = (
    <>
      <p className="mb-3 text-center text-[9px] leading-snug font-medium text-amber-800 bg-amber-50/90 px-2.5 py-1.5 rounded-full border border-amber-200/80">
        Preview — test rotation & WhatsApp
      </p>

      <RotatorContentFrame className={`mb-5 ${getRotatorFrameClass(imageSize)}`}>
        <div className={`mx-auto ${imageClass}`}>
          <Image
            src={displayUrl}
            alt="Landing preview"
            fill
            className="object-contain rounded-2xl"
            unoptimized={displayUrl.startsWith("blob:")}
          />
        </div>
      </RotatorContentFrame>

      <p className="mb-3 text-center text-[11px] sm:text-xs leading-relaxed text-slate-600 px-1 animate-pulse">
        {loadingText || "Sedang sambungkan anda ke team kami..."}
      </p>

      <div className="w-full flex justify-center">
        <RotatorCountdownRing value={countdown} total={2} size="sm" />
      </div>
    </>
  );

  if (compact) {
    return (
      <RotatorSceneBackground className="rounded-2xl py-6 px-3">
        <RotatorPhoneFrame>{screenContent}</RotatorPhoneFrame>
      </RotatorSceneBackground>
    );
  }

  return (
    <div className="space-y-4">
      {showLabel && (
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          <Smartphone className="w-4 h-4" />
          Preview Mobile
        </div>
      )}

      <RotatorSceneBackground className="rounded-2xl py-8 px-4">
        <RotatorPhoneFrame>{screenContent}</RotatorPhoneFrame>
      </RotatorSceneBackground>

      {showLabel && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Paparan ini meniru skrin telefon pengunjung
        </p>
      )}

      {showLinkActions && slug && linksEnabled ? (
        <RotatorLinkActions slug={slug} layout="stack" size="sm" />
      ) : null}

      {showLinkActions && slug && !linksEnabled ? (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Simpan page dahulu untuk buka preview & link live.
        </p>
      ) : null}
    </div>
  );
}
