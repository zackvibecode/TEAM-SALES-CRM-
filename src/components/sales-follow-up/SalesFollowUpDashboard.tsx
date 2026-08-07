"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  UserCheck,
  Award,
  UserX,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { DashboardMetricTile, DashboardMetricSection } from "@/components/shared/DashboardMetricTile";
import { FilterBar } from "./FilterBar";
import { FollowUpChart } from "./FollowUpChart";
import { LeadTable } from "./LeadTable";
import { LeadFormModal } from "./LeadFormModal";
import { FollowUpFormModal } from "./FollowUpFormModal";
import { PicPerformanceTable } from "./PicPerformanceTable";
import { ToastContainer, useToast } from "./Toast";
import type {
  SalesPic,
  SalesLead,
  SalesLeadWithLastFollowUp,
  DashboardStats,
  ChartDataPoint,
  PicPerformanceRow,
  CreateLeadInput,
  CreateFollowUpInput,
} from "@/lib/sales-follow-up/types";

export function SalesFollowUpDashboard() {
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [picId, setPicId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("all");

  // Data
  const [pics, setPics] = useState<SalesPic[]>([]);
  const [leads, setLeads] = useState<SalesLeadWithLastFollowUp[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    total_follow_ups: 0,
    followed_up_once: 0,
    followed_up_three: 0,
    no_follow_up: 0,
    overdue: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [performance, setPerformance] = useState<PicPerformanceRow[]>([]);

  // UI state
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState<SalesLead | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<SalesLeadWithLastFollowUp | null>(null);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (followUpFilter && followUpFilter !== "all") params.set("followUpFilter", followUpFilter);
    return params.toString();
  }, [startDate, endDate, picId, status, search, followUpFilter]);

  const fetchPics = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-follow-up/pics");
      if (res.ok) {
        const data = await res.json();
        setPics(data.pics || []);
      }
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const filterParams = buildFilterParams();
      const res = await fetch(`/api/sales-follow-up/dashboard?${filterParams}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {} finally {
      setLoadingStats(false);
    }
  }, [buildFilterParams]);

  const fetchChart = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (picId) params.set("picId", picId);
      if (status) params.set("status", status);
      params.set("type", "chart");
      const res = await fetch(`/api/sales-follow-up/pic-performance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data.chartData || []);
      }
    } catch {}
  }, [startDate, endDate, picId, status]);

  const fetchPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (picId) params.set("picId", picId);
      if (status) params.set("status", status);
      const res = await fetch(`/api/sales-follow-up/pic-performance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPerformance(data.performance || []);
      }
    } catch {}
  }, [startDate, endDate, picId, status]);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const filterParams = buildFilterParams();
      const res = await fetch(`/api/sales-follow-up/leads?${filterParams}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {} finally {
      setLoadingLeads(false);
    }
  }, [buildFilterParams]);

  useEffect(() => {
    fetchPics();
  }, [fetchPics]);

  useEffect(() => {
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }, [fetchStats, fetchLeads, fetchChart, fetchPerformance]);

  // CRUD handlers
  async function handleCreateLead(data: CreateLeadInput) {
    const res = await fetch("/api/sales-follow-up/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal mencipta lead.");
    toast("Lead berjaya ditambah.", "success");
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }

  async function handleUpdateLead(leadId: string, data: Partial<CreateLeadInput>) {
    const res = await fetch(`/api/sales-follow-up/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal mengemaskini lead.");
    toast("Lead berjaya dikemaskini.", "success");
    setEditLead(null);
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }

  async function handleDeleteLead(lead: SalesLeadWithLastFollowUp) {
    const res = await fetch(`/api/sales-follow-up/leads/${lead.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Gagal memadam lead.");
    }
    toast("Lead berjaya dipadam.", "success");
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }

  async function handleCreateFollowUp(data: CreateFollowUpInput) {
    const res = await fetch(`/api/sales-follow-up/leads/${data.lead_id}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal menyimpan follow-up.");
    toast("Follow-up berjaya disimpan.", "success");
    setFollowUpTarget(null);
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }

  function handleExportCsv() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    if (status) params.set("status", status);
    params.set("format", "csv");
    window.open(`/api/sales-follow-up/export?${params.toString()}`, "_blank");
  }

  function handleRefresh() {
    fetchStats();
    fetchLeads();
    fetchChart();
    fetchPerformance();
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Sales Follow-Up Dashboard</h1>
          <p className="page-subtitle mt-1">
            Pantau aktiviti follow-up dan prestasi pasukan jualan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Segar semula data"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditLead(null);
              setShowAddLead(true);
            }}
            className="btn-primary-solid flex items-center gap-2 text-sm"
          >
            <Plus className="size-4" />
            Tambah Lead Baru
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        picId={picId}
        status={status}
        search={search}
        followUpFilter={followUpFilter}
        pics={pics}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPicChange={setPicId}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onFollowUpFilterChange={setFollowUpFilter}
      />

      {/* KPI Cards */}
      <DashboardMetricSection>
        <DashboardMetricTile
          label="Jumlah Lead"
          value={loadingStats ? "..." : stats.total_leads}
          icon={Users}
          accent="gray"
        />
        <DashboardMetricTile
          label="Aktiviti Follow-Up"
          value={loadingStats ? "..." : stats.total_follow_ups}
          icon={MessageSquare}
          accent="info"
        />
        <DashboardMetricTile
          label="Difollow-Up (Min 1x)"
          value={loadingStats ? "..." : stats.followed_up_once}
          icon={UserCheck}
          accent="warning"
        />
        <DashboardMetricTile
          label="Selesai (Min 3x FU)"
          value={loadingStats ? "..." : stats.followed_up_three}
          icon={Award}
          accent="success"
          highlight
        />
      </DashboardMetricSection>

      <DashboardMetricSection>
        <DashboardMetricTile
          label="Belum Follow-Up"
          value={loadingStats ? "..." : stats.no_follow_up}
          icon={UserX}
          accent="error"
        />
        <DashboardMetricTile
          label="Overdue Follow-Up"
          value={loadingStats ? "..." : stats.overdue}
          icon={AlertCircle}
          accent="error"
        />
      </DashboardMetricSection>

      {/* Chart & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpChart data={chartData} />
        <PicPerformanceTable data={performance} onExportCsv={handleExportCsv} />
      </div>

      {/* Leads Table */}
      <LeadTable
        leads={leads}
        loading={loadingLeads}
        onView={(lead) => router.push(`/admin/sales-follow-up/leads/${lead.id}`)}
        onAddFollowUp={(lead) => {
          setFollowUpTarget(lead);
        }}
        onEdit={(lead) => {
          setEditLead(lead as unknown as SalesLead);
          setShowAddLead(true);
        }}
        onDelete={handleDeleteLead}
      />

      {/* Modals */}
      <LeadFormModal
        open={showAddLead}
        onClose={() => {
          setShowAddLead(false);
          setEditLead(null);
        }}
        onSave={async (data) => {
          if (editLead) {
            await handleUpdateLead(editLead.id, data);
          } else {
            await handleCreateLead(data);
          }
        }}
        pics={pics}
        editLead={editLead}
      />

      {followUpTarget && (
        <FollowUpFormModal
          open={!!followUpTarget}
          onClose={() => setFollowUpTarget(null)}
          onSave={handleCreateFollowUp}
          leadId={followUpTarget.id}
          leadName={followUpTarget.customer_name}
          currentFollowUpCount={followUpTarget.total_follow_ups}
        />
      )}
    </div>
  );
}
