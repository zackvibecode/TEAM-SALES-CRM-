"use client";

import { useState } from "react";
import {
  Eye,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  Phone,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateShort, formatDateMY } from "@/lib/sales-follow-up/dates";
import { FollowUpProgressBadge } from "./FollowUpProgressBadge";
import { SalesLeadStatusBadge } from "./SalesLeadStatusBadge";
import type { SalesLeadWithLastFollowUp } from "@/lib/sales-follow-up/types";

interface LeadTableProps {
  leads: SalesLeadWithLastFollowUp[];
  loading: boolean;
  canDelete?: boolean;
  onView: (lead: SalesLeadWithLastFollowUp) => void;
  onAddFollowUp: (lead: SalesLeadWithLastFollowUp) => void;
  onEdit: (lead: SalesLeadWithLastFollowUp) => void;
  onDelete: (lead: SalesLeadWithLastFollowUp) => void;
}

export function LeadTable({
  leads,
  loading,
  canDelete = true,
  onView,
  onAddFollowUp,
  onEdit,
  onDelete,
}: LeadTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="surface-card rounded-xl p-12 text-center">
        <Loader2 className="size-8 mx-auto animate-spin" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
          Memuatkan data...
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
          Tiada lead dijumpai
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Tambah lead baru atau ubah filter untuk melihat data.
        </p>
      </div>
    );
  }

  async function handleDelete(lead: SalesLeadWithLastFollowUp) {
    setDeletingId(lead.id);
    try {
      await onDelete(lead);
    } finally {
      setDeletingId(null);
      setShowConfirm(null);
    }
  }

  function openWhatsApp(normalizedPhone: string) {
    window.open(`https://wa.me/${normalizedPhone}`, "_blank");
  }

  return (
    <div className="surface-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--surface-muted)" }}>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Pelanggan
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Telefon
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                PIC
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Produk
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Follow-Up
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Respon Terkini
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Status
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                Tindakan
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="table-row">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-semibold truncate max-w-[180px]" style={{ color: "var(--text-primary)" }}>
                      {lead.customer_name || "-"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatDateMY(lead.created_at)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => openWhatsApp(lead.normalized_phone_number)}
                    className="flex items-center gap-1.5 text-sm font-mono tracking-tight hover:underline"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Phone className="size-3" style={{ color: "var(--text-muted)" }} />
                    {lead.phone_number}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {lead.assigned_pic?.name || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {lead.destination_or_product || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <FollowUpProgressBadge count={lead.total_follow_ups} />
                    {lead.last_follow_up_date && (
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {formatDateShort(lead.last_follow_up_date)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-sm line-clamp-2 max-w-[160px]"
                    style={{ color: "var(--text-secondary)" }}
                    title={lead.latest_response || undefined}
                  >
                    {lead.latest_response || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <SalesLeadStatusBadge status={lead.lead_status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onAddFollowUp(lead)}
                      className="btn-primary-solid inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5"
                      title="Rekod follow-up baru"
                    >
                      <Plus className="size-3.5" />
                      Follow-Up
                    </button>
                    <ActionBtn
                      title="Lihat sejarah follow-up"
                      onClick={() => onView(lead)}
                      icon={<Eye className="size-3.5" />}
                    />
                    <ActionBtn
                      title="WhatsApp"
                      onClick={() => openWhatsApp(lead.normalized_phone_number)}
                      icon={<MessageCircle className="size-3.5" />}
                      colorClass="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-500/10"
                    />
                    <ActionBtn
                      title="Edit lead"
                      onClick={() => onEdit(lead)}
                      icon={<Pencil className="size-3.5" />}
                    />

                    <div className="relative">
                      {canDelete &&
                        (showConfirm === lead.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(lead)}
                            disabled={deletingId === lead.id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition"
                            title="Sahkan padam"
                          >
                            {deletingId === lead.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setShowConfirm(null)}
                            className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10 transition"
                            title="Batal"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <ActionBtn
                          title="Padam lead"
                          onClick={() => setShowConfirm(lead.id)}
                          icon={<Trash2 className="size-3.5" />}
                          colorClass="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        />
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({
  title,
  onClick,
  icon,
  colorClass,
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition",
        colorClass || "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
      )}
    >
      {icon}
    </button>
  );
}

export function ChevronDownIcon() {
  return <ChevronDown className="size-3" />;
}
