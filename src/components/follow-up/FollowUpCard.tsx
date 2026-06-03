"use client";

import { Phone, Calendar, User, MessageCircle, Check, CalendarPlus, History } from "lucide-react";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import type { FollowUpRow } from "@/lib/follow-up/types";
import { BRAND_WHATSAPP_INTRO } from "@/lib/brand";

export function FollowUpCard({
  row,
  onFollowUpWhatsApp,
  onMarkCompleted,
  onSchedule,
  onViewHistory,
  busy,
}: {
  row: FollowUpRow;
  onFollowUpWhatsApp: (row: FollowUpRow) => void;
  onMarkCompleted: (row: FollowUpRow) => void;
  onSchedule: (row: FollowUpRow) => void;
  onViewHistory: (row: FollowUpRow) => void;
  busy?: boolean;
}) {
  const lead = row.lead;
  if (!lead) return null;

  const lastContact = lead.last_contacted_at
    ? new Date(lead.last_contacted_at).toLocaleString("en-MY", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : lead.clicked_at
      ? new Date(lead.clicked_at as string).toLocaleString("en-MY", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  const displayStatus =
    row.status === "pending" && row.follow_up_date < new Date().toISOString().slice(0, 10)
      ? "overdue"
      : row.status;

  return (
    <div className="card rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900">{lead.name}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3.5 h-3.5" />
            {lead.whatsapp}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FollowUpStatusBadge number={row.follow_up_number} />
          <FollowUpStatusBadge status={displayStatus as "pending"} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          Next: <strong>{row.follow_up_date}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
          Last WA: {lastContact}
        </span>
        {lead.campaign_name && (
          <span className="sm:col-span-2 text-slate-500">Campaign: {lead.campaign_name}</span>
        )}
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          {row.sales_user_name || lead.assigned_sales_user_name || "—"}
        </span>
      </div>

      {row.note && (
        <p className="text-sm text-slate-600 bg-blue-50/60 rounded-xl px-3 py-2 border border-blue-100/80">
          {row.note}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => onFollowUpWhatsApp(row)}
          className="btn-whatsapp px-3 py-2"
        >
          Follow Up via WhatsApp
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onMarkCompleted(row)}
          className="btn-ghost text-xs border border-emerald-200 text-emerald-800"
        >
          <Check className="w-3.5 h-3.5" /> Mark Completed
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSchedule(row)}
          className="btn-ghost text-xs"
        >
          <CalendarPlus className="w-3.5 h-3.5" /> Schedule Next
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onViewHistory(row)}
          className="btn-ghost text-xs"
        >
          <History className="w-3.5 h-3.5" /> View History
        </button>
      </div>
    </div>
  );
}

export function openWhatsApp(wa: string, name: string) {
  const message = BRAND_WHATSAPP_INTRO.replace(/\{name\}/gi, name.trim() || "Tuan/Puan");
  window.open(
    `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
