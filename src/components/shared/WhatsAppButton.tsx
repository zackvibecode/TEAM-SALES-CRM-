"use client";

import React, { useState } from "react";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppRateLimitModal } from "@/components/shared/WhatsAppRateLimitModal";

interface WhatsAppButtonProps {
  leadId: string;
  whatsapp: string;
  customerName?: string;
  messageTemplate?: string;
  clickedFrom?: "lead_card" | "follow_up_queue";
  onSuccess?: (leadId: string, counted: boolean) => void;
  onError?: (message: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({
  leadId,
  whatsapp,
  customerName,
  messageTemplate,
  clickedFrom = "lead_card",
  onSuccess,
  onError,
  className,
  children,
}: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [recentClickCount, setRecentClickCount] = useState(0);

  const executeClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales/whatsapp-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, clickedFrom }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result.error || "Failed to update status";
        onError?.(msg);
        alert(msg);
        return;
      }

      onSuccess?.(leadId, result.counted !== false);

      let message = messageTemplate?.trim() ?? "";
      if (message && customerName) {
        message = message.replace(/\{name\}/gi, customerName.trim() || "Tuan/Puan");
      }

      window.open(
        getWhatsAppLink(result.whatsapp || whatsapp, message || undefined),
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      onError?.(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (loading) return;

    try {
      const rateRes = await fetch("/api/sales/whatsapp-click-rate", { cache: "no-store" });
      const rateData = await rateRes.json();

      if (rateRes.ok && rateData.warning) {
        setRecentClickCount(rateData.clickCount ?? 0);
        setShowWarning(true);
        return;
      }
    } catch {
      // Proceed if rate check fails — do not block the sales flow.
    }

    await executeClick();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        aria-busy={loading}
      >
        {loading ? "..." : children || "Contact WhatsApp"}
      </button>

      <WhatsAppRateLimitModal
        open={showWarning}
        clickCount={recentClickCount}
        onClose={() => setShowWarning(false)}
        onContinue={() => {
          setShowWarning(false);
          void executeClick();
        }}
      />
    </>
  );
}
