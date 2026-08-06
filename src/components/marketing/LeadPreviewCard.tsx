"use client";

import { CalendarClock, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

/**
 * Original interactive CRM lead preview card.
 * Built from the product's real lead fields (name, package, WhatsApp)
 * using existing marketing copy — no backend calls, display only.
 */
export function LeadPreviewCard() {
  const { copy } = useMarketingLocale();
  const demo = copy.hero.demo;

  return (
    <div className="relative px-2 sm:px-8 lg:px-0">
      {/* Floating chips */}
      <div
        className="lead-float hidden sm:flex animate-chip-float -left-2 lg:-left-8 top-10 motion-reduce:hidden"
        aria-hidden
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#e9f7da", color: "#2e6b1c" }}
        >
          <CheckCircle2 className="w-4 h-4" />
        </span>
        <span>Excel import</span>
      </div>
      <div
        className="lead-float hidden sm:flex animate-chip-float-alt -right-2 lg:-right-6 bottom-16 motion-reduce:hidden"
        aria-hidden
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#e9f7da", color: "#2e6b1c" }}
        >
          <CalendarClock className="w-4 h-4" />
        </span>
        <span>Follow-up queue</span>
      </div>

      <div className="lead-preview-card overflow-hidden">
        {/* Card header */}
        <div
          className="flex items-center justify-between px-6 sm:px-7 py-4 border-b"
          style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {demo.formTitle}
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: "#e9f7da", color: "#2e6b1c" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-hero-pulse" style={{ background: "#4f9e2c" }} />
            Live
          </span>
        </div>

        {/* Lead fields */}
        <div className="px-6 sm:px-7 py-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
              {demo.nameLabel}
            </p>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {demo.nameValue}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="rounded-2xl px-4 py-3 border"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                {demo.packageLabel}
              </p>
              <p className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
                {demo.packageValue}
              </p>
            </div>
            <div
              className="rounded-2xl px-4 py-3 border"
              style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                {demo.waLabel}
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {demo.waValue}
              </p>
            </div>
          </div>

          {/* WhatsApp message preview */}
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "#c2e894", background: "rgba(233, 247, 218, 0.45)" }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <MessageCircle className="w-4 h-4" style={{ color: "#2e6b1c" }} />
              <p className="text-xs font-bold" style={{ color: "#2e6b1c" }}>
                {demo.chatBrand} · {demo.chatContact}
              </p>
            </div>
            <div
              className="rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[13px] leading-relaxed"
              style={{ background: "var(--surface-card)", color: "var(--text-secondary)" }}
            >
              {demo.reply}
            </div>
            <p className="mt-1.5 text-right text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {demo.time}
            </p>
          </div>

          {/* CTA row */}
          <div className="flex items-center gap-3 pt-1">
            <span className="btn-whatsapp flex-1 !rounded-full !py-3 !text-sm !px-4" aria-hidden>
              <Send className="w-4 h-4" />
              {demo.submit}
            </span>
          </div>

          {/* Summary strip */}
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t text-[11px] font-semibold"
            style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
          >
            {demo.chatLines.map((line) => (
              <span key={line} className="truncate max-w-full">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
