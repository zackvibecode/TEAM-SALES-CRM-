"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { resolveWhatsAppMessage } from "@/lib/whatsapp-templates";
import type { LeadStatus, UserProfile } from "@/types";

interface LeadItem {
  id: string;
  owner_id: string;
  owner_name: string;
  source_file_id: string | null;
  name: string;
  whatsapp: string;
  package_interest: string;
  status: string;
  notes: string;
  created_at: string;
}

export function AllLeadsClient({
  initialLeads,
  salesUsers,
  batches,
  whatsappPretext,
}: {
  initialLeads: LeadItem[];
  salesUsers: Pick<UserProfile, "id" | "full_name">[];
  batches: { id: string; label: string }[];
  whatsappPretext?: string | null;
}) {
  const searchParams = useSearchParams();
  const batchFromUrl = searchParams.get("batch") || "";
  const [batchFilter, setBatchFilter] = useState(batchFromUrl);
  const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState("");

  const filtered = useMemo(() => {
    if (!batchFilter) return initialLeads;
    return initialLeads.filter((l) => l.source_file_id === batchFilter);
  }, [initialLeads, batchFilter]);

  const handleReassign = async () => {
    if (!reassignLeadId || !newOwner) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/reassign-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: reassignLeadId, newOwnerUserId: newOwner, adminId: user?.id }),
    });
    if (res.ok) window.location.reload();
    else alert((await res.json()).error || "Failed");
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="input-field py-2 max-w-xs"
        >
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
        <a
          href={
            batchFilter
              ? `/api/admin/export-leads?fileId=${batchFilter}`
              : "/api/admin/export-leads"
          }
          className="btn-primary-solid text-sm"
        >
          Export CSV
        </a>
        <span className="text-sm ml-auto" style={{ color: "var(--text-muted)" }}>{filtered.length} leads</span>
      </div>

      <DataTable
        data={filtered.map((l) => ({ ...l })) as Record<string, unknown>[]}
        columns={[
          { key: "owner_name", label: "Owner" },
          { key: "name", label: "Customer" },
          {
            key: "whatsapp",
            label: "WhatsApp",
            render: (row) => {
              const wa = row.whatsapp as string;
              if (!wa) return <span className="text-slate-400 text-xs">-</span>;
              const name = (row.name as string) || "";
              const message = resolveWhatsAppMessage(whatsappPretext, name);
              const link = getWhatsAppLink(wa, message);
              return (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{wa}</span>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="btn-whatsapp px-2 py-1 text-xs">
                    Open
                  </a>
                </div>
              );
            },
          },
          { key: "package_interest", label: "Package" },
          {
            key: "status",
            label: "Status",
            render: (row) => <StatusBadge status={row.status as LeadStatus} />,
          },
          {
            key: "actions",
            label: "Re-assign",
            render: (row) => (
              <button
                type="button"
                onClick={() => {
                  setReassignLeadId(row.id as string);
                  setNewOwner(row.owner_id as string);
                }}
                className="text-xs text-primary hover:underline"
              >
                Change owner
              </button>
            ),
          },
        ]}
        searchKeys={["name", "whatsapp", "owner_name"]}
        searchPlaceholder="Search name, WhatsApp, owner..."
        emptyMessage="No leads found."
        pageSize={25}
      />

      {reassignLeadId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h3 className="font-semibold">Re-assign lead</h3>
            <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="input-field">
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setReassignLeadId(null)} className="flex-1 border rounded-xl py-2 text-sm">
                Cancel
              </button>
              <button onClick={handleReassign} className="flex-1 btn-primary-solid">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
