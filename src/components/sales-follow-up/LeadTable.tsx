"use client";

import { useState, Fragment } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Check,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { sfReplace } from "@/lib/i18n/en/salesFollowUp";
import { followUpStatusLabel } from "@/lib/sales-follow-up/labels";
import { FollowUpProgressBadge } from "./FollowUpProgressBadge";
import { SalesLeadStatusBadge } from "./SalesLeadStatusBadge";
import type {
  FollowUpStatusType,
  LeadStatus,
  SalesLeadWithLastFollowUp,
} from "@/lib/sales-follow-up/types";

const QUICK_STATUSES: FollowUpStatusType[] = [
  "No Response",
  "Replied",
  "Interested",
  "KIV",
  "Not Interested",
];

const COMPLETE_STATUSES: LeadStatus[] = ["Booked", "KIV", "Closed"];

export type PendingQuickState = {
  followUpId: string;
  totalFollowUps: number;
};

interface LeadTableProps {
  leads: SalesLeadWithLastFollowUp[];
  loading: boolean;
  canDelete?: boolean;
  showPicSelect?: boolean;
  followingUpId?: string | null;
  justDoneId?: string | null;
  pendingQuick?: Record<string, PendingQuickState>;
  selectedIds?: string[];
  statusUpdatingId?: string | null;
  onToggleSelect?: (leadId: string) => void;
  onToggleSelectAll?: () => void;
  onView: (lead: SalesLeadWithLastFollowUp) => void;
  onAddFollowUp: (lead: SalesLeadWithLastFollowUp) => void;
  onEdit: (lead: SalesLeadWithLastFollowUp) => void;
  onDelete: (lead: SalesLeadWithLastFollowUp) => void | Promise<void>;
  onQuickStatus?: (lead: SalesLeadWithLastFollowUp, status: FollowUpStatusType) => void;
  onCompleteStatus?: (lead: SalesLeadWithLastFollowUp, status: LeadStatus) => void;
  onDismissQuick?: (leadId: string) => void;
}

/** Format nombor Malaysia pendek: +60123456789 → 012-345 6789 */
function formatMyPhoneShort(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("60") && digits.length >= 11) {
    const local = digits.slice(2); // 0123456789
    return `${local.slice(0, 3)}-${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return raw;
}

export function LeadTable({
  leads,
  loading,
  canDelete = true,
  showPicSelect = true,
  followingUpId = null,
  justDoneId = null,
  pendingQuick = {},
  selectedIds = [],
  statusUpdatingId = null,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onAddFollowUp,
  onEdit,
  onDelete,
  onQuickStatus,
  onCompleteStatus,
  onDismissQuick,
}: LeadTableProps) {
  const { t, locale } = useAppLocale();
  const sf = t.salesFollowUp;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="surface-card rounded-xl p-12 text-center">
        <Loader2 className="size-8 mx-auto animate-spin" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
          {sf.loadingData}
        </p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="surface-card rounded-xl p-12 text-center">
        <div
          className="size-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--surface-muted)" }}
        >
          <Eye className="size-7" style={{ color: "var(--text-muted)" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {sf.noLeads}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {sf.noLeadsHint}
        </p>
      </div>
    );
  }

  function handleDelete(lead: SalesLeadWithLastFollowUp) {
    // Instant UI — do not wait for network
    setShowConfirm(null);
    setDeletingId(null);
    void Promise.resolve(onDelete(lead));
  }

  function openWhatsApp(normalizedPhone: string) {
    window.open(`https://wa.me/${normalizedPhone}`, "_blank");
  }

  function followUpButtonLabel(lead: SalesLeadWithLastFollowUp) {
    if (followingUpId === lead.id) return sf.followUpSaving;
    if (justDoneId === lead.id || lead.total_follow_ups >= 3) return sf.alreadyFollowedUp;
    const next = lead.total_follow_ups + 1;
    if (next <= 3) return sfReplace(sf.followUpNext, { n: next });
    return sf.followUpAction;
  }

  function isFollowUpDone(lead: SalesLeadWithLastFollowUp) {
    return justDoneId === lead.id || lead.total_follow_ups >= 3;
  }

  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      {/* Table-fixed + width kolum tetap — semua kolum muat dalam satu container tanpa scroll tepi */}
      <table className="w-full table-fixed">
        <thead>
          <tr style={{ backgroundColor: "var(--surface-muted)" }}>
            {onToggleSelect && (
              <th className="w-[36px] px-2 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleSelectAll?.()}
                  aria-label="Select all"
                />
              </th>
            )}
            <th className="w-[20%] px-3 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colCustomer}
            </th>
            <th className="w-[13%] px-3 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colPhone}
            </th>
            {showPicSelect && (
              <th className="w-[9%] px-3 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {sf.colPic}
              </th>
            )}
            <th className="w-[15%] px-3 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colProduct}
            </th>
            <th className="w-[9%] px-3 py-3 text-center text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colFollowUps}
            </th>
            <th className="w-[11%] px-3 py-3 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colStatus}
            </th>
            <th className="w-[23%] px-3 py-3 text-center text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {sf.colActions}
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const isSaving = followingUpId === lead.id;
            const isDone = isFollowUpDone(lead);
            const pending = pendingQuick[lead.id];
            const showQuick = Boolean(pending && onQuickStatus);
            const showComplete =
              Boolean(pending && pending.totalFollowUps >= 3 && onCompleteStatus);
            const isExpanded = expandedId === lead.id;
            const history = lead.recent_follow_ups ?? [];
            const colSpan = 6 + (onToggleSelect ? 1 : 0) + (showPicSelect ? 1 : 0);

            return (
              <Fragment key={lead.id}>
                <tr className="table-row">
                  {onToggleSelect && (
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => onToggleSelect(lead.id)}
                        aria-label={`Select ${lead.customer_name || lead.id}`}
                      />
                    </td>
                  )}
                  {/* Customer — truncate, hover title tunjuk nama penuh */}
                  <td className="px-3 py-3">
                    <p
                      className="text-sm font-semibold truncate"
                      title={lead.customer_name || sf.unnamed}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {lead.customer_name || sf.unnamed}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatDate(lead.created_at, locale)}
                    </p>
                  </td>
                  {/* Phone — format pendek Malaysia, title tunjuk nombor penuh */}
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => openWhatsApp(lead.normalized_phone_number)}
                      className="flex items-center gap-1 text-[13px] font-mono tracking-tight hover:underline max-w-full"
                      title={lead.phone_number}
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Phone className="size-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span className="truncate">
                        {formatMyPhoneShort(lead.normalized_phone_number || lead.phone_number)}
                      </span>
                    </button>
                  </td>
                  {showPicSelect && (
                    <td className="px-3 py-3">
                      <span
                        className="text-sm font-medium truncate block"
                        title={lead.assigned_pic?.name || undefined}
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {lead.assigned_pic?.name || "-"}
                      </span>
                    </td>
                  )}
                  {/* Notes — truncate, title tunjuk penuh */}
                  <td className="px-3 py-3">
                    <span
                      className="text-[13px] truncate block"
                      title={lead.import_notes || undefined}
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {lead.import_notes || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <FollowUpProgressBadge count={lead.total_follow_ups} size="sm" showSteps={false} />
                      {lead.last_follow_up_at ? (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {formatDateTime(lead.last_follow_up_at, locale)}
                        </span>
                      ) : lead.last_follow_up_date ? (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {formatDate(lead.last_follow_up_date, locale)}
                        </span>
                      ) : null}
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId((id) => (id === lead.id ? null : lead.id))
                          }
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {isExpanded ? (
                            <>
                              {sf.historyHide} <ChevronUp className="size-3" />
                            </>
                          ) : (
                            <>
                              {sf.historyExpand} <ChevronDown className="size-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <SalesLeadStatusBadge status={lead.lead_status} />
                  </td>
                  {/* Actions — padat: follow-up btn kecil + icons satu baris */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onAddFollowUp(lead)}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition",
                            isDone
                              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                              : "btn-primary-solid",
                            isSaving && "opacity-70"
                          )}
                          title={followUpButtonLabel(lead)}
                        >
                          {isSaving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : isDone ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <Phone className="size-3.5" />
                          )}
                          <span className="hidden lg:inline">{followUpButtonLabel(lead)}</span>
                          <span className="lg:hidden">{sf.followUpAction}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onView(lead)}
                          className="inline-flex items-center justify-center size-8 rounded-lg border transition shrink-0"
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--surface-muted)",
                          }}
                          title={sf.viewLead}
                          aria-label={sf.viewLead}
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(lead)}
                          className="inline-flex items-center justify-center size-8 rounded-lg border transition shrink-0"
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--surface-muted)",
                          }}
                          title={sf.editLead}
                          aria-label={sf.editLead}
                        >
                          <Pencil className="size-4" />
                        </button>

                        {canDelete &&
                          (showConfirm === lead.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(lead)}
                                disabled={deletingId === lead.id}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                                title={sf.confirmDelete}
                              >
                                {deletingId === lead.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Check className="size-3.5" />
                                )}
                                {sf.yesDelete}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowConfirm(null)}
                                className="inline-flex items-center justify-center size-8 rounded-lg border transition shrink-0"
                                style={{
                                  borderColor: "var(--border-color)",
                                  color: "var(--text-muted)",
                                }}
                                title={sf.cancel}
                                aria-label={sf.cancel}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowConfirm(lead.id)}
                              className="inline-flex items-center justify-center size-8 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition shrink-0"
                              style={{ color: "#dc2626" }}
                              title={sf.deleteLead}
                              aria-label={sf.deleteLead}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          ))}
                      </div>

                      {showQuick && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {QUICK_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={statusUpdatingId === lead.id}
                              onClick={() => onQuickStatus?.(lead, status)}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md border transition"
                              style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-secondary)",
                                backgroundColor: "var(--surface-muted)",
                              }}
                            >
                              {followUpStatusLabel(sf, status)}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => onDismissQuick?.(lead.id)}
                            className="text-[10px] px-1"
                            style={{ color: "var(--text-muted)" }}
                            title={sf.cancel}
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      )}

                      {showComplete && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {COMPLETE_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={statusUpdatingId === lead.id}
                              onClick={() => onCompleteStatus?.(lead, status)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md btn-primary-solid"
                            >
                              {status === "Booked"
                                ? sf.statusBooked
                                : status === "KIV"
                                  ? sf.statusKiv
                                  : sf.statusClosed}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr style={{ backgroundColor: "var(--surface-muted)" }}>
                    <td colSpan={colSpan} className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {history.map((fu) => (
                          <div
                            key={fu.id}
                            className="text-[11px] rounded-lg px-3 py-2 border"
                            style={{
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--surface-card)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                              {sfReplace(sf.fuRound, { n: fu.follow_up_number })}
                            </span>
                            {" · "}
                            {followUpStatusLabel(sf, fu.status)}
                            {" · "}
                            {formatDateTime(fu.created_at, locale)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
