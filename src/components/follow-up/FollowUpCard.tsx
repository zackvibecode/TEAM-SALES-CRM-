"use client";

import { Phone, Calendar, User, CalendarPlus, History, MessageCircle } from "lucide-react";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import type { FollowUpRow } from "@/lib/follow-up/types";
import { BRAND_WHATSAPP_INTRO } from "@/lib/brand";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-MY", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function FollowUpCard({
  row,
  showSalesUser,
  onFollowUpWhatsApp,
  onSchedule,
  onViewHistory,
  busy,
}: {
  row: FollowUpRow;
  showSalesUser?: boolean;
  onFollowUpWhatsApp: (row: FollowUpRow) => void;
  onSchedule: (row: FollowUpRow) => void;
  onViewHistory: (row: FollowUpRow) => void;
  busy?: boolean;
}) {
  const lead = row.lead;
  if (!lead) return null;

  const displayStatus =
    row.status === "pending" && row.follow_up_date < new Date().toISOString().slice(0, 10)
      ? "overdue"
      : row.status;

  const followUpCount = lead.follow_up_count ?? row.follow_up_number ?? 0;
  const lastFollowUp = lead.last_followed_up_at ?? null;

  return (
    <div className="card rounded-2xl p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">{lead.name}</h3>
          <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            {lead.whatsapp || "—"}
          </p>
        </div>
        <FollowUpStatusBadge status={displayStatus as "pending"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Last follow up: <strong>{formatDateTime(lastFollowUp)}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Next follow up: <strong>{row.follow_up_date}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          Follow up count: <strong>{followUpCount}</strong>
        </span>
        {showSalesUser && (
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 shrink-0" />
            {row.sales_user_name || lead.assigned_sales_user_name || "—"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => onFollowUpWhatsApp(row)}
          className="btn-follow-up w-full"
        >
          Follow Up
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSchedule(row)}
            className="btn-secondary flex-1 min-w-[120px]"
          >
            <CalendarPlus className="w-4 h-4" /> Schedule Next
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onViewHistory(row)}
            className="btn-secondary flex-1 min-w-[120px]"
          >
            <History className="w-4 h-4" /> View History
          </button>
        </div>
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
