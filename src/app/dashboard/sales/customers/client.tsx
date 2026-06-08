"use client";

import { useState, useCallback, useMemo, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { resolveWhatsAppMessage } from "@/lib/whatsapp-templates";
import { Search, X, Clock, CalendarRange, ArrowUpDown } from "lucide-react";
import {
  formatLeadDateCreated,
  leadCreatedAtInRange,
  parseDateCreated,
  sortLeadsByDateCreated,
  type DateCreatedSortDirection,
} from "@/lib/lead-date-created";
import type { Lead, LeadActivity, LeadStatus } from "@/types";

const TASK_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "Pending", label: "Pending" },
  { value: "Clicked", label: "Clicker" },
  { value: "Follow Up", label: "Follow Up" },
];

const NOTES_REQUIRED: LeadStatus[] = ["Follow Up"];

interface CustomersClientProps {
  initialLeads: Lead[];
  batches: BatchOption[];
  pendingCount: number;
  totalCount: number;
  userEmail: string;
  whatsappPretext?: string | null;
}

interface BatchOption {
  id: string;
  label: string;
}

function CustomersClientInner({
  initialLeads,
  pendingCount,
  totalCount,
  userEmail,
  whatsappPretext,
}: CustomersClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [queueMode, setQueueMode] = useState(false);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>("Pending");
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDirection, setSortDirection] = useState<DateCreatedSortDirection>("asc");
  const pageSize = 20;

  const dateRangeActive = Boolean(dateFrom && dateTo);

  const whatsappMessage = useCallback(
    (name: string) => resolveWhatsAppMessage(whatsappPretext, name),
    [whatsappPretext]
  );

  const patchLead = useCallback((leadId: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...patch } : l)));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/sales/my-leads");
      const json = await res.json();
      if (res.ok && json.leads) {
        setLeads(json.leads);
        // #region agent log
        const arr = json.leads as Lead[];
        const years = [
          ...new Set(
            arr
              .slice(0, 200)
              .map((l) => new Date(parseDateCreated(l.created_at)).getFullYear())
              .filter((y) => y > 1970)
          ),
        ].sort();
        fetch("http://127.0.0.1:7550/ingest/9ea49f98-0131-4e47-8093-2c8680050cb4", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ef1fce" },
          body: JSON.stringify({
            sessionId: "ef1fce",
            hypothesisId: "H-DISPLAY",
            location: "client.tsx:refreshData",
            message: "leads years in UI",
            data: {
              count: arr.length,
              distinctYears: years,
              sampleDisplay: arr.slice(0, 3).map((l) => ({
                name: l.name,
                created_at: l.created_at,
                display: formatLeadDateCreated(l.created_at),
              })),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      } else if (!res.ok) {
        console.error("Load leads:", json.error);
      }
    } finally {
      setLoadingLeads(false);
      window.dispatchEvent(new Event("zaqone:refresh-daily"));
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (queueMode && statusFilter === "" && l.status !== "Pending") return false;
      if (!queueMode && !statusFilter && l.status === "Clicked") return false;
      if (search) {
        const s = search.toLowerCase();
        if (!l.name.toLowerCase().includes(s) && !l.whatsapp.includes(s)) return false;
      }
      if (statusFilter && l.status !== statusFilter) return false;
      if (dateRangeActive && !leadCreatedAtInRange(l.created_at, dateFrom, dateTo)) {
        return false;
      }
      return true;
    });

    return sortLeadsByDateCreated(list, sortDirection);
  }, [leads, search, statusFilter, queueMode, dateRangeActive, dateFrom, dateTo, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const usesRowOrderForSort = useMemo(() => {
    if (leads.length < 2) return false;
    const years = new Set(
      leads.slice(0, 100).map((l) => new Date(l.created_at).getFullYear())
    );
    return years.size === 1 && leads.some((l) => l.list_order != null);
  }, [leads]);

  const loadActivities = async (leadId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(20);
    setActivities(data || []);
  };

  const handleUpdateStatus = async (leadId: string) => {
    if (NOTES_REQUIRED.includes(editStatus) && !editNotes.trim()) {
      setEditError("Notes required for this status.");
      return;
    }
    setEditError("");
    setSaving(true);

    try {
      const res = await fetch("/api/sales/update-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          status: editStatus,
          notes: editNotes,
          followUpAt: editFollowUp || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setEditError(result.error || "Failed to save");
        return;
      }
      if (result.lead) {
        patchLead(leadId, result.lead as Lead);
      }
      setEditingId(null);
      await refreshData();
    } catch {
      setEditError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppSuccess = useCallback(
    async (leadId: string, counted = true) => {
      if (counted) {
        const now = new Date().toISOString();
        patchLead(leadId, {
          status: "Clicked",
          clicked_at: now,
          updated_at: now,
        });
        await refreshData();
      }
    },
    [patchLead, refreshData]
  );

  const clearDateRange = () => {
    setDateFrom("");
    setDateTo("");
    setDateRangeOpen(false);
    setPage(1);
  };

  const openEditor = (lead: Lead) => {
    setEditingId(lead.id);
    setEditStatus(lead.status as LeadStatus);
    setEditNotes(lead.notes);
    setEditFollowUp(lead.follow_up_at ? lead.follow_up_at.slice(0, 10) : "");
    setEditError("");
    loadActivities(lead.id);
  };

  const bookTotal = totalCount > 0 ? totalCount : leads.length;

  return (
    <div className="space-y-4">
      {loadingLeads && (
        <div className="glass-card rounded-2xl p-4 text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
          Loading your full lead book…
        </div>
      )}
      {!loadingLeads && bookTotal > 0 && (
        <div className="glass-strong rounded-3xl px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          Your book: <strong>{bookTotal.toLocaleString()}</strong> leads
          · <strong>{pendingCount.toLocaleString()}</strong> pending
          · {userEmail}
        </div>
      )}
      {!loadingLeads && bookTotal === 0 && (
        <div className="alert-error text-sm">
          No tasks assigned to <strong>{userEmail}</strong> yet.
          Admin must upload CSV and select your name/email in Assign / Upload.
        </div>
      )}

      {bookTotal > 0 && queueMode && filtered.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl px-4 py-3">
          No Pending leads in queue. Click <strong>All leads</strong> to see {bookTotal - pendingCount} in progress.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setQueueMode(true); setStatusFilter(""); setPage(1); }}
          className={`px-3 py-2 text-sm font-semibold border ${
            queueMode && !statusFilter ? "filter-pill-active" : "filter-pill"
          }`}
        >
          <Clock className="w-3.5 h-3.5 inline mr-1" />
          My queue (Pending)
        </button>
        <button
          type="button"
          onClick={() => { setQueueMode(false); setStatusFilter(""); setPage(1); }}
          className={`px-3 py-2 text-sm font-semibold border ${
            !queueMode && !statusFilter ? "filter-pill-active" : "filter-pill"
          }`}
        >
          All leads
        </button>
        {TASK_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setStatusFilter(s.value); setQueueMode(false); setPage(1); }}
            className={`px-3 py-2 text-sm font-semibold border ${
              statusFilter === s.value ? "filter-pill-active" : "filter-pill"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search name or WhatsApp..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 py-2"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => setDateRangeOpen((o) => !o)}
              className={`px-3 py-2 text-sm font-semibold border inline-flex items-center gap-1.5 ${
                dateRangeOpen || dateRangeActive ? "filter-pill-active" : "filter-pill"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Customize by date
            </button>
            <button
              type="button"
              onClick={() => {
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
                setPage(1);
              }}
              className="px-3 py-2 text-sm font-semibold border filter-pill inline-flex items-center gap-1.5"
              title="Sort by Date Created"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortDirection === "asc" ? "Old → New" : "New → Old"}
            </button>
            <span className="text-sm self-center" style={{ color: "var(--text-muted)" }}>
              {filtered.length} customers
            </span>
          </div>
        </div>
        {usesRowOrderForSort && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Sort uses Excel row order (No. 1, 2, 3…). Date Created shows upload day until admin adds a{" "}
            <strong>Date Created</strong> column in Excel and re-uploads.
          </p>
        )}
        {dateRangeOpen && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs max-w-[150px]"
              aria-label="Date from"
            />
            <span style={{ color: "var(--text-muted)" }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-field py-1.5 text-xs max-w-[150px]"
              aria-label="Date to"
            />
            {dateRangeActive && (
              <button type="button" onClick={clearDateRange} className="btn-secondary text-xs px-3 py-1.5">
                Clear
              </button>
            )}
            {!dateRangeActive && (dateFrom || dateTo) && (
              <span className="text-xs text-amber-700">Select both From and To to filter.</span>
            )}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="table-shell hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="table-th">Name</th>
                <th className="table-th">WhatsApp</th>
                <th className="table-th hidden sm:table-cell">Date Created</th>
                <th className="table-th text-center">Status</th>
                <th className="table-th text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((lead) => (
                <tr key={lead.id} className="table-row">
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{lead.name || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{lead.whatsapp || "-"}</td>
                  <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                    {formatLeadDateCreated(lead.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={lead.status as LeadStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <WhatsAppButton
                        leadId={lead.id}
                        whatsapp={lead.whatsapp}
                        customerName={lead.name}
                        messageTemplate={whatsappMessage(lead.name)}
                        onSuccess={handleWhatsAppSuccess}
                        className="btn-whatsapp px-3 py-2 shadow-sm min-h-[40px] disabled:opacity-60"
                      >
                        WhatsApp
                      </WhatsAppButton>
                      <button
                        onClick={() => openEditor(lead)}
                        className="btn-secondary text-xs px-3 py-2"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    {queueMode ? "Queue clear — great job!" : "No customers found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.map((lead) => (
          <div key={lead.id} className="card-padded-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{lead.name || "-"}</p>
                <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>{lead.whatsapp || "-"}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {formatLeadDateCreated(lead.created_at)}
                </p>
              </div>
              <StatusBadge status={lead.status as LeadStatus} />
            </div>
            <div className="flex gap-2">
              <WhatsAppButton
                leadId={lead.id}
                whatsapp={lead.whatsapp}
                customerName={lead.name}
                messageTemplate={whatsappMessage(lead.name)}
                onSuccess={handleWhatsAppSuccess}
                className="btn-whatsapp px-3 py-2 flex-1 min-h-[44px] disabled:opacity-60"
              >
                WhatsApp
              </WhatsAppButton>
              <button onClick={() => openEditor(lead)} className="btn-secondary text-xs px-3 py-2">
                Edit
              </button>
            </div>
          </div>
        ))}
        {paginated.length === 0 && (
          <div className="card-padded-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
            {queueMode ? "Queue clear — great job!" : "No customers found."}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {leads.find((l) => l.id === editingId)?.name}
              </h2>
              <button onClick={() => setEditingId(null)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && <div className="alert-error">{editError}</div>}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                  className="input-field"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Notes {NOTES_REQUIRED.includes(editStatus) && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="Call outcome, next step..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Follow-up date</label>
                <input
                  type="date"
                  value={editFollowUp}
                  onChange={(e) => setEditFollowUp(e.target.value)}
                  className="input-field"
                />
              </div>
              {activities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)" }}>Timeline</p>
                  <ul className="space-y-2 max-h-32 overflow-y-auto text-xs">
                    {activities.map((a) => (
                      <li key={a.id} className="border-l-2 border-primary/30 pl-2" style={{ color: "var(--text-secondary)" }}>
                        {new Date(a.created_at).toLocaleString("en-MY")} — {a.activity_type.replace("_", " ")}
                        {a.old_status && a.new_status && (
                          <span>: {a.old_status} → {a.new_status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-2.5 text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(editingId)}
                  disabled={saving}
                  className="btn-primary-solid flex-1 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomersClient(props: CustomersClientProps) {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-muted)" }}>Loading...</p>}>
      <CustomersClientInner {...props} />
    </Suspense>
  );
}
