"use client";

import { AlertTriangle, X } from "lucide-react";
import { WHATSAPP_RATE_LIMIT, WHATSAPP_RATE_LIMIT_WARNING } from "@/lib/whatsapp-rate-limit";

interface WhatsAppRateLimitModalProps {
  open: boolean;
  clickCount: number;
  onClose: () => void;
  onContinue: () => void;
}

export function WhatsAppRateLimitModal({
  open,
  clickCount,
  onClose,
  onContinue,
}: WhatsAppRateLimitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900">
        <div className="bg-amber-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">{WHATSAPP_RATE_LIMIT_WARNING.title}</h2>
          <p className="text-amber-100 text-sm mt-2">
            {clickCount} WhatsApp clicks in the last {WHATSAPP_RATE_LIMIT.windowMinutes} minutes
            (limit: {WHATSAPP_RATE_LIMIT.maxClicks}).
          </p>
        </div>
        <div className="p-6 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>{WHATSAPP_RATE_LIMIT_WARNING.speed}</p>
          <p>{WHATSAPP_RATE_LIMIT_WARNING.variation}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {WHATSAPP_RATE_LIMIT_WARNING.action}
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">
              Wait
            </button>
            <button onClick={onContinue} className="btn-primary-solid flex-1 py-2.5 text-sm">
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
