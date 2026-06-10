"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import {
  getRotatorFrameClass,
  getRotatorImageClass,
  getRotatorImageSizesAttr,
  normalizeImageSize,
  type RotatorImageSize,
} from "@/lib/rotator/display";
import { fetchRotatorAssign } from "@/lib/rotator/assign-client";
import { RotatorSceneBackground } from "./RotatorSceneBackground";
import { RotatorContentFrame } from "./RotatorContentFrame";
import { RotatorStatusCard, errorToVariant } from "./RotatorStatusCard";
import { RotatorCountdownRing } from "./RotatorCountdownRing";

const VISITOR_COOKIE = "rotator_visitor_id";
const PREVIEW_VISITOR_COOKIE = "rotator_preview_visitor_id";
const COUNTDOWN_SECONDS = 2;

function getOrCreateVisitorId(previewMode: boolean): string {
  if (typeof window === "undefined") return "";

  const key = previewMode ? PREVIEW_VISITOR_COOKIE : VISITOR_COOKIE;
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const id = previewMode ? `preview-${crypto.randomUUID()}` : crypto.randomUUID();
  localStorage.setItem(key, id);
  if (!previewMode) {
    document.cookie = `${VISITOR_COOKIE}=${id};path=/;max-age=31536000;SameSite=Lax`;
  }
  return id;
}

interface CountdownRedirectProps {
  slug: string;
  imageUrl: string;
  loadingText: string;
  imageSize?: RotatorImageSize | string | null;
  source: string;
  campaign: string;
  previewMode?: boolean;
}

/** Public rotator: scenic layout, curved content frame, countdown → WhatsApp */
export function CountdownRedirect({
  slug,
  imageUrl,
  loadingText,
  imageSize = "large",
  source,
  campaign,
  previewMode = false,
}: CountdownRedirectProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const assignOnceRef = useRef(false);
  const size = normalizeImageSize(imageSize);
  const imageClass = getRotatorImageClass(size);

  const trackSource = previewMode ? "preview" : source;
  const trackCampaign = previewMode ? "admin_test" : campaign;

  const assignSales = useCallback(async () => {
    if (assignOnceRef.current) return;
    assignOnceRef.current = true;
    setAssigning(true);

    const visitorId = getOrCreateVisitorId(previewMode);
    try {
      const data = await fetchRotatorAssign(slug, {
        slug,
        visitor_id: visitorId,
        source: trackSource,
        campaign: trackCampaign,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      });

      if (!data.success) {
        assignOnceRef.current = false;
        setError(
          data.error === "page_not_found" ? "Link tidak dijumpai." :
          data.error === "page_inactive" ? "Link ini tidak aktif buat sementara waktu." :
          data.error === "no_active_sales" ? "Team kami sedang tidak tersedia. Sila cuba sebentar lagi." :
          "Ralat berlaku. Sila cuba lagi."
        );
        return;
      }

      setWhatsappUrl(data.whatsapp_url ?? null);
    } catch {
      assignOnceRef.current = false;
      setError("Ralat sambungan. Sila cuba lagi.");
    } finally {
      setAssigning(false);
    }
  }, [slug, trackSource, trackCampaign, previewMode]);

  useEffect(() => {
    assignSales();
  }, [assignSales]);

  useEffect(() => {
    if (countdown <= 0 || !whatsappUrl || error) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, whatsappUrl, error]);

  useEffect(() => {
    if (previewMode || countdown > 0 || !whatsappUrl || error) return;

    const timer = setTimeout(() => {
      window.location.href = whatsappUrl;
      setTimeout(() => setRedirectFailed(true), 1500);
    }, 100);
    return () => clearTimeout(timer);
  }, [countdown, whatsappUrl, error, previewMode]);

  if (error) {
    return (
      <RotatorStatusCard
        variant={errorToVariant(error)}
        message={error}
        onRetry={() => {
          assignOnceRef.current = false;
          setError(null);
          setCountdown(COUNTDOWN_SECONDS);
          assignSales();
        }}
      />
    );
  }

  const showWhatsappButton =
    !!whatsappUrl && (previewMode || redirectFailed || countdown <= 0);

  return (
    <RotatorSceneBackground className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
      {previewMode && (
        <p className="mb-4 sm:mb-5 max-w-xs sm:max-w-md text-center text-[11px] sm:text-xs font-medium text-amber-800 bg-amber-50/90 px-3 sm:px-4 py-2 rounded-full border border-amber-200/80 shadow-sm">
          Preview mode — rotation aktif, tekan butang untuk test WhatsApp
        </p>
      )}

      <RotatorContentFrame className={`mb-5 sm:mb-7 ${getRotatorFrameClass(size)}`}>
        <div className={`mx-auto ${imageClass}`}>
          <Image
            src={imageUrl}
            alt="Preview"
            fill
            className="object-contain rounded-2xl"
            priority
            sizes={getRotatorImageSizesAttr(size)}
          />
        </div>
      </RotatorContentFrame>

      <p className="text-[13px] sm:text-base text-slate-600 mb-5 sm:mb-6 text-center max-w-[min(100%,20rem)] sm:max-w-md leading-relaxed animate-pulse px-2">
        {loadingText}
      </p>

      {assigning ? (
        <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-[#3b66ff] border-t-transparent rounded-full animate-spin" />
      ) : countdown > 0 && whatsappUrl ? (
        <div className="w-full flex justify-center">
          <RotatorCountdownRing value={countdown} total={COUNTDOWN_SECONDS} size="md" />
        </div>
      ) : !previewMode && countdown <= 0 && whatsappUrl ? (
        <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-[#3b66ff] border-t-transparent rounded-full animate-spin" />
      ) : null}

      {showWhatsappButton && (
        <a
          href={whatsappUrl!}
          className="mt-5 sm:mt-7 btn-whatsapp text-sm sm:text-base px-5 sm:px-6 py-3 rounded-full shadow-lg inline-flex items-center justify-center gap-2 w-full max-w-[min(100%,20rem)]"
          target={previewMode ? "_blank" : undefined}
          rel={previewMode ? "noopener noreferrer" : undefined}
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          {previewMode ? "Test WhatsApp Sekarang" : "Tekan sini untuk WhatsApp"}
        </a>
      )}

      {previewMode && whatsappUrl && countdown > 0 && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs sm:text-sm font-medium text-[#3b66ff] underline underline-offset-2"
        >
          Langkau countdown → buka WhatsApp
        </a>
      )}
    </RotatorSceneBackground>
  );
}
