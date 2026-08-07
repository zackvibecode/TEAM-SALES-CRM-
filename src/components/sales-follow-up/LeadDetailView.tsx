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
  Trash2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp, formatDateMY, todayKL } from "@/lib/sales-follow-up/dates";
import { FollowUpProgressBadge } from "./FollowUpProgressBadge";
import { SalesLeadStatusBadge } from "./SalesLeadStatusBadge";
import { FollowUpTimeline } from "./FollowUpTimeline";
import { FollowUpFormModal } from "./FollowUpFormModal";
import { ToastContainer, useToast } from "./Toast";
import type {
  SalesLead,
  LeadFollowUp,
  SalesPic,
  CreateFollowUpInput,
} from "@/lib/sales-follow-up/types";

interface LeadDetailViewProps {
  leadId: string;
  onBack: () => void;
}

export function LeadDetailView({ leadId, onBack }: LeadDetailViewProps) {
  const { toasts, toast, removeToast } = useToast();

  const [lead, setLead] = useState<SalesLead | null>(null);
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [pics, setPics] = useState<SalesPic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFU, setShowAddFU] = useState(false);
  const [deletingFuId, setDeletingFuId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, fuRes, picsRes] = await Promise.all([
        fetch(`/api/sales-follow-up/leads/${leadId}`),
        fetch(`/api/sales-follow-up/leads/${leadId}/follow-ups`),
        fetch("/api/sales-follow-up/pics"),
      ]);

      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLead(leadData.lead);
      }
      if (fuRes.ok) {
        const fuData = await fuRes.json();
        setFollowUps(fuData.followUps || []);
      }
      if (picsRes.ok) {
        const picsData = await picsRes.json();
        setPics(picsData.pics || []);
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

  async function handleCreateFollowUp(data: CreateFollowUpInput) {
    const res = await fetch(`/api/sales-follow-up/leads/${leadId}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal menyimpan follow-up.");
    toast("Follow-up berjaya disimpan.", "success");
    setShowAddFU(false);
    fetchData();
  }

  async function handleDeleteFollowUp(fuId: string) {
    setDeletingFuId(fuId);
    try {
      const res = await fetch(`/api/sales-follow-up/follow-ups/${fuId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Gagal memadam follow-up.");
      }
      toast("Follow-up berjaya dipadam.", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memadam follow-up.", "error");
    } finally {
      setDeletingFuId(null);
    }
  }

  function openWhatsApp() {
    if (lead?.normalized_phone_number) {
      window.open(`https://wa.me/${lead.normalized_phone_number}`, "_blank");
    }
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
          Lead tidak dijumpai.
        </p>
        <button onClick={onBack} className="btn-secondary mt-4 text-sm">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="size-4" />
        Kembali ke Dashboard
      </button>

      {/* Lead Info Card */}
      <div className="surface-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {lead.customer_name || "Tanpa Nama"}
              </h2>
              <SalesLeadStatusBadge status={lead.lead_status} />
              <FollowUpProgressBadge count={lead.total_follow_ups} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoItem icon={<Phone className="size-4" />} label="Telefon" value={lead.phone_number} />
              <InfoItem icon={<MapPin className="size-4" />} label="Produk" value={lead.destination_or_product || "-"} />
              <InfoItem icon={<Tag className="size-4" />} label="Sumber" value={lead.source || "-"} />
              <InfoItem icon={<User className="size-4" />} label="PIC" value={lead.assigned_pic?.name || "-"} />
              <InfoItem icon={<Calendar className="size-4" />} label="Dicipta" value={formatDateMY(lead.created_at)} />
              <InfoItem icon={<Calendar className="size-4" />} label="FU Seterusnya" value={lead.next_follow_up_date ? formatDateMY(lead.next_follow_up_date) : "-"} />
              <InfoItem icon={<MessageSquare className="size-4" />} label="Respon Terkini" value={lead.latest_response || "-"} span={2} />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openWhatsApp}
              className="btn-whatsapp flex items-center gap-2 text-sm"
            >
              <Phone className="size-4" />
              WhatsApp
            </button>
            <button
              onClick={() => setShowAddFU(true)}
              className="btn-primary-solid flex items-center gap-2 text-sm"
            >
              <CheckCircle2 className="size-4" />
              Tambah Follow-Up
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Sejarah Follow-Up ({followUps.length})
          </h3>
        </div>
        <FollowUpTimeline followUps={followUps} emptyMessage="Tiada rekod follow-up untuk lead ini." />
      </div>

      {/* Follow-Up Form Modal */}
      {showAddFU && (
        <FollowUpFormModal
          open={showAddFU}
          onClose={() => setShowAddFU(false)}
          onSave={handleCreateFollowUp}
          leadId={lead.id}
          leadName={lead.customer_name}
          currentFollowUpCount={lead.total_follow_ups}
          pics={pics}
        />
      )}
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
    <div
      className={cn(
        "flex items-center gap-2.5 min-w-0",
        span === 2 && "sm:col-span-2"
      )}
    >
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
