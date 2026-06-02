"use client";

import React, { useState } from "react";
import { BRAND_WHATSAPP_INTRO } from "@/lib/brand";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  leadId: string;
  whatsapp: string;
  customerName?: string;
  messageTemplate?: string;
  onSuccess?: (leadId: string) => void;
  onError?: (message: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({
  leadId,
  whatsapp,
  customerName,
  messageTemplate,
  onSuccess,
  onError,
  className,
  children,
}: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/sales/whatsapp-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg = result.error || "Failed to update status";
        onError?.(msg);
        alert(msg);
        return;
      }

      onSuccess?.(leadId);

      let message = messageTemplate || BRAND_WHATSAPP_INTRO;
      if (customerName) {
        message = message.replace(/\{name\}/gi, customerName.trim() || "Tuan/Puan");
      }

      const wa = formatWhatsAppNumber(result.whatsapp || whatsapp);
      window.open(
        `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      aria-busy={loading}
    >
      {loading ? "..." : children || "Contact WhatsApp"}
    </button>
  );
}
