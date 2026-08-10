"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Tag,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { formatDate } from "@/lib/i18n/format";
import { sfReplace } from "@/lib/i18n/en/salesFollowUp";
import { mapSalesFollowUpApiError } from "@/lib/sales-follow-up/api-error";
import { salesFollowUpWhatsAppLink } from "@/lib/sales-follow-up/whatsapp-messages";
import { followUpStatusLabel } from "@/lib/sales-follow-up/labels";
import { FollowUpProgressBadge } from "./FollowUpProgressBadge";
import { SalesLeadStatusBadge } from "./SalesLeadStatusBadge";
import { FollowUpTimeline } from "./FollowUpTimeline";
import { ToastContainer, useToast } from "./Toast";
import type {
  SalesLead,
  LeadFollowUp,
  FollowUpStatusType,
  LeadStatus,
} from "@/lib/sales-follow-up/types";

const QUICK_STATUSES: FollowUpStatusType[] = [
  "No Response",
  "Replied",
  "Interested",
  "KIV",
  "Not Interested",
];

const COMPLETE_STATUSES: LeadStatus[] = ["Booked", "KIV", "Closed"];

interface LeadDetailViewProps {
  leadId: string;
  onBack: () => void;
}

export function LeadDetailView({ leadId, onBack }: LeadDetailViewProps) {
  const { t, locale } = useAppLocale();
  const sf = t.salesFollowUp;
  const { toasts, toast, removeToast } = useToast();

  const [lead, setLead] = useState<SalesLead | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFu, setSavingFu] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [lastFollowUpId, setLastFollowUpId] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, fuRes] = await Promise.all([
        fetch(`/api/sales-follow-up/leads/${leadId}`),
        fetch(`/api/sales-follow-up/leads/${leadId}/follow-ups`),
      ]);

      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLead(leadData.lead);
      }
      if (fuRes.ok) {
        const fuData = await fuRes.json();
        setFollowUps(fuData.followUps || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleQuickFollowUp() {
    if (!lead || savingFu) return;
    setSavingFu(true);
    try {
      const nextNum = lead.total_follow_ups + 1;
      if (lead.normalized_phone_number || lead.phone_number) {
        window.open(
          salesFollowUpWhatsAppLink(
            lead.normalized_phone_number || lead.phone_number,
            nextNum,
            lead.customer_name || ""
          ),
          "_blank"
        );
      }
      const res = await fetch(`/api/sales-follow-up/leads/${leadId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          status: "No Response",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFollowUpFail"));
      setLastFollowUpId(result.followUp?.id ?? null);
      toast(sf.toastFollowUpSaved, "success");
      setJustDone(true);
      window.setTimeout(() => setJustDone(false), 2500);
      await fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFollowUpFail, "error");
    } finally {
      setSavingFu(false);
    }
  }

  async function handleQuickStatus(status: FollowUpStatusType) {
    if (!lastFollowUpId || statusBusy) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/sales-follow-up/follow-ups/${lastFollowUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFollowUpFail"));
      toast(sf.toastStatusUpdated, "success");
      await fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFollowUpFail, "error");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleCompleteStatus(status: LeadStatus) {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/sales-follow-up/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_status: status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFail"));
      toast(sf.toastStatusUpdated, "success");
      setLastFollowUpId(null);
      await fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFail, "error");
    } finally {
      setStatusBusy(false);
    }
  }

  function openWhatsApp() {
    if (!lead) return;
    const nextNum = Math.max(lead.total_follow_ups, 1);
    window.open(
      salesFollowUpWhatsAppLink(
        lead.normalized_phone_number || lead.phone_number,
        nextNum,
        lead.customer_name || ""
      ),
      "_blank"
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {sf.leadNotFound}
        </p>
        <button onClick={onBack} className="btn-secondary mt-4 text-sm">
          {sf.back}
        </button>
      </div>
    );
  }

  const nextN = lead.total_follow_ups + 1;
  const fuDone = justDone || lead.total_follow_ups >= 3;
  const fuLabel = savingFu
    ? sf.followUpSaving
    : fuDone
      ? sf.alreadyFollowedUp
      : nextN <= 3
        ? sfReplace(sf.followUpNext, { n: nextN })
        : sf.addFollowUp;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="size-4" />
        {sf.backToDashboard}
      </button>

      <div className="surface-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {lead.customer_name || sf.unnamed}
              </h2>
              <SalesLeadStatusBadge status={lead.lead_status} />
              <FollowUpProgressBadge count={lead.total_follow_ups} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoItem icon={<Phone className="size-4" />} label={sf.phone} value={lead.phone_number} />
              <InfoItem icon={<MapPin className="size-4" />} label={sf.product} value={lead.destination_or_product || "-"} />
              <InfoItem icon={<Tag className="size-4" />} label={sf.source} value={lead.source || "-"} />
              <InfoItem icon={<User className="size-4" />} label={sf.colPic} value={lead.assigned_pic?.name || "-"} />
              <InfoItem icon={<Calendar className="size-4" />} label={sf.created} value={formatDate(lead.created_at, locale)} />
              <InfoItem
                icon={<Calendar className="size-4" />}
                label={sf.nextFu}
                value={lead.next_follow_up_date ? formatDate(lead.next_follow_up_date, locale) : "-"}
              />
              <InfoItem
                icon={<MessageSquare className="size-4" />}
                label={sf.latestResponse}
                value={lead.latest_response || "-"}
                span={2}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={openWhatsApp} className="btn-whatsapp flex items-center gap-2 text-sm">
              <Phone className="size-4" />
              {sf.whatsapp}
            </button>
            <button
              type="button"
              disabled={savingFu}
              onClick={() => void handleQuickFollowUp()}
              className={cn(
                "flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-semibold transition",
                fuDone
                  ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                  : "btn-primary-solid",
                savingFu && "opacity-70"
              )}
            >
              {savingFu ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {fuLabel}
            </button>
          </div>
        </div>
      </div>

      {lastFollowUpId && (
        <div className="surface-card rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {sf.quickStatusHint}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                disabled={statusBusy}
                onClick={() => void handleQuickStatus(status)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--surface-muted)",
                }}
              >
                {followUpStatusLabel(sf, status)}
              </button>
            ))}
          </div>
          {lead.total_follow_ups >= 3 && (
            <>
              <p className="text-xs font-medium pt-1" style={{ color: "var(--text-secondary)" }}>
                {sf.completeHint}
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPLETE_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={statusBusy}
                    onClick={() => void handleCompleteStatus(status)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg btn-primary-solid"
                  >
                    {status === "Booked"
                      ? sf.statusBooked
                      : status === "KIV"
                        ? sf.statusKiv
                        : sf.statusClosed}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {sfReplace(sf.historyTitle, { n: followUps.length })}
          </h3>
        </div>
        <FollowUpTimeline followUps={followUps} emptyMessage={sf.historyEmpty} />
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  span,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  span?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", span === 2 && "sm:col-span-2")}>
      <div className="shrink-0" style={{ color: "var(--text-muted)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
