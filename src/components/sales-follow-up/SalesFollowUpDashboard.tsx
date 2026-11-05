"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Upload,
  MessageCircle,
  FolderOpen,
  X,
} from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { sfReplace } from "@/lib/i18n/en/salesFollowUp";
import { FilterBar, type DatePreset } from "./FilterBar";
import { FollowUpChart } from "./FollowUpChart";
import { LeadTable, type PendingQuickState, type SortKey, type SortDir } from "./LeadTable";
import { LeadFormModal } from "./LeadFormModal";
import { PicPerformanceTable } from "./PicPerformanceTable";
import { UploadExcelModal } from "./UploadExcelModal";
import { UploadHistoryTable, type UploadBatchRow } from "./UploadHistoryTable";
import { FollowUpStageTabs, type FollowUpStageValue } from "./FollowUpStageTabs";
import { PackageFilterTabs, type PackageFilterValue } from "./PackageFilterTabs";
import { SfuWaTemplatesModal } from "./SfuWaTemplatesModal";
import { ToastContainer, useToast } from "./Toast";
import { SALES_FOLLOW_UP_SETUP_SQL } from "@/lib/sales-follow-up/setup-sql";
import { mapSalesFollowUpApiError } from "@/lib/sales-follow-up/api-error";
import {
  salesFollowUpWhatsAppLink,
  type SfuWaTemplates,
} from "@/lib/sales-follow-up/whatsapp-messages";
import type {
  SalesPic,
  SalesLead,
  SalesLeadWithLastFollowUp,
  DashboardStats,
  ChartDataPoint,
  PicPerformanceRow,
  CreateLeadInput,
  FollowUpStatusType,
  LeadStatus,
  PackageCount,
} from "@/lib/sales-follow-up/types";

export function SalesFollowUpDashboard({
  mode = "admin",
}: {
  mode?: "admin" | "sales";
}) {
  const router = useRouter();
  const { t } = useAppLocale();
  const sf = t.salesFollowUp;
  const isSales = mode === "sales";
  const detailBase = isSales
    ? "/dashboard/sales/sales-follow-up/leads"
    : "/admin/sales-follow-up/leads";
  const { toasts, toast, removeToast } = useToast();

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [picId, setPicId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  // Data
  const [pics, setPics] = useState<SalesPic[]>([]);
  const [leads, setLeads] = useState<SalesLeadWithLastFollowUp[]>([]);
  const [packages, setPackages] = useState<PackageCount[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    total_follow_ups: 0,
    followed_up_once: 0,
    followed_up_three: 0,
    no_follow_up: 0,
    overdue: 0,
    follow_up_1: 0,
    follow_up_2: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [performance, setPerformance] = useState<PicPerformanceRow[]>([]);
  const [waTemplates, setWaTemplates] = useState<SfuWaTemplates>({});
  const [showWaTemplates, setShowWaTemplates] = useState(false);
  const [batches, setBatches] = useState<UploadBatchRow[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // UI state
  const [loadingLeads, setLoadingLeads] = useState(true);
  // Stats loading state — KPI cards dah dibuang; state dikekalkan untuk fetch sync
  const [loadingStats, setLoadingStats] = useState(true);
  void loadingStats;
  const [showAddLead, setShowAddLead] = useState(false);
  const [showUploadExcel, setShowUploadExcel] = useState(false);
  const [editLead, setEditLead] = useState<SalesLead | null>(null);
  const [followingUpId, setFollowingUpId] = useState<string | null>(null);
  const [justDoneId, setJustDoneId] = useState<string | null>(null);
  const [pendingQuick, setPendingQuick] = useState<Record<string, PendingQuickState>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkAssignPicId, setBulkAssignPicId] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  // Sorting leads — default: terbaru dulu
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "created_at",
    dir: "desc",
  });
  // Batch dipilih dari Upload History — kosong = semua leads
  const [selectedBatchId, setSelectedBatchId] = useState("");

  function handleSortChange(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  /** Leads sorted ikut kolum aktif */
  const sortedLeads = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const phoneOf = (l: SalesLeadWithLastFollowUp) =>
      (l.normalized_phone_number || l.phone_number || "").replace(/\D/g, "");
    const cmp = (a: SalesLeadWithLastFollowUp, b: SalesLeadWithLastFollowUp) => {
      switch (sort.key) {
        case "customer_name":
          return (a.customer_name || "").localeCompare(b.customer_name || "", undefined, { sensitivity: "base" }) * dir;
        case "phone":
          return phoneOf(a).localeCompare(phoneOf(b)) * dir;
        case "pic":
          return ((a.assigned_pic?.name || "").localeCompare(b.assigned_pic?.name || "", undefined, { sensitivity: "base" })) * dir;
        case "notes":
          return ((a.import_notes || "").localeCompare(b.import_notes || "", undefined, { sensitivity: "base" })) * dir;
        case "follow_ups":
          return ((a.total_follow_ups ?? 0) - (b.total_follow_ups ?? 0)) * dir;
        case "status":
          return (a.lead_status || "").localeCompare(b.lead_status || "") * dir;
        case "created_at":
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    };
    return [...leads].sort(cmp);
  }, [leads, sort]);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-follow-up/health");
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setSetupError("setup_required");
        setDbReady(false);
        return false;
      }
      setSetupError(null);
      setDbReady(true);
      return true;
    } catch {
      setSetupError("setup_required");
      setDbReady(false);
      return false;
    }
  }, []);

  async function copySetupSql() {
    try {
      await navigator.clipboard.writeText(SALES_FOLLOW_UP_SETUP_SQL);
      setSqlCopied(true);
      toast(sf.toastSqlCopied, "success");
      setTimeout(() => setSqlCopied(false), 2500);
    } catch {
      toast(sf.toastSqlCopyFail, "error");
    }
  }

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (followUpFilter && followUpFilter !== "all") params.set("followUpFilter", followUpFilter);
    if (packageFilter && packageFilter !== "all") params.set("packageFilter", packageFilter);
    if (selectedBatchId) params.set("batchId", selectedBatchId);
    return params.toString();
  }, [startDate, endDate, picId, status, search, followUpFilter, packageFilter, selectedBatchId]);

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
        const { packages: packageRows, ...rest } = data as DashboardStats & {
          packages?: PackageCount[];
        };
        setStats(rest);
        // Always update packages array (never leave stale / missing for some users)
        setPackages(Array.isArray(packageRows) ? packageRows : []);
      }
    } catch {} finally {
      setLoadingStats(false);
    }
  }, [buildFilterParams]);

  const fetchChartAndPerformance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (picId) params.set("picId", picId);
      if (status) params.set("status", status);
      params.set("type", "all");
      const res = await fetch(`/api/sales-follow-up/pic-performance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data.chartData || []);
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

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/sales-follow-up/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch {
      // history is non-critical
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const ok = await checkHealth();
      if (!ok) return;
      fetchPics();
    })();
  }, [checkHealth, fetchPics]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/profile/sfu-wa-templates", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setWaTemplates(data.templates || {});
      } catch {
        // keep defaults
      }
    })();
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    fetchStats();
    fetchLeads();
    fetchChartAndPerformance();
    fetchBatches();
  }, [dbReady, fetchStats, fetchLeads, fetchChartAndPerformance, fetchBatches]);

  /** Merge server package counts with packages visible in current lead list (post-upload safety). */
  const displayPackages = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of packages) {
      map.set(p.name, Math.max(map.get(p.name) ?? 0, p.count));
    }
    for (const lead of leads) {
      const name = (lead.destination_or_product || "").trim();
      if (!map.has(name)) map.set(name, 0);
      // If server empty but leads have names, count from leads
      if (packages.length === 0) {
        map.set(name, (map.get(name) ?? 0) + 1);
      }
    }
    // If server has data but a package appears in leads and not in server yet
    if (packages.length > 0) {
      for (const lead of leads) {
        const name = (lead.destination_or_product || "").trim();
        if (name && !packages.some((p) => p.name === name)) {
          map.set(name, (map.get(name) ?? 0) + 1);
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .filter((p) => p.count > 0 || p.name === "")
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
  }, [packages, leads]);

  // CRUD handlers
  async function handleCreateLead(data: CreateLeadInput) {
    const res = await fetch("/api/sales-follow-up/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFail"));
    toast(sf.toastLeadAdded, "success");
    fetchStats();
    fetchLeads();
    fetchChartAndPerformance();
  }

  async function handleUpdateLead(leadId: string, data: Partial<CreateLeadInput>) {
    const res = await fetch(`/api/sales-follow-up/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFail"));
    toast(sf.toastLeadUpdated, "success");
    setEditLead(null);
    fetchStats();
    fetchLeads();
    fetchChartAndPerformance();
  }

  async function handleDeleteLead(lead: SalesLeadWithLastFollowUp) {
    // Instant remove — network runs in background
    const snapshot = leads;
    const pkgName = (lead.destination_or_product || "").trim();
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setSelectedIds((prev) => prev.filter((id) => id !== lead.id));
    setStats((prev) => ({
      ...prev,
      total_leads: Math.max(0, (prev.total_leads ?? 0) - 1),
    }));
    setPackages((prev) =>
      prev
        .map((p) =>
          p.name === pkgName ? { ...p, count: Math.max(0, p.count - 1) } : p
        )
        .filter((p) => p.count > 0 || p.name === "")
    );
    toast(sf.toastLeadDeleted, "success");

    void fetch(`/api/sales-follow-up/leads/${lead.id}`, { method: "DELETE" })
      .then(async (res) => {
        if (!res.ok) {
          const result = await res.json().catch(() => ({}));
          setLeads(snapshot);
          toast(mapSalesFollowUpApiError(sf, result, "errGeneric"), "error");
          void fetchStats();
          void fetchLeads();
        }
      })
      .catch(() => {
        setLeads(snapshot);
        toast(sf.errGeneric, "error");
        void fetchLeads();
      });
  }

  async function handleQuickFollowUp(lead: SalesLeadWithLastFollowUp) {
    if (followingUpId) return;
    setFollowingUpId(lead.id);
    try {
      const nextNum = lead.total_follow_ups + 1;
      window.open(
        salesFollowUpWhatsAppLink(
          lead.normalized_phone_number || lead.phone_number,
          nextNum,
          lead.customer_name || "",
          waTemplates,
          lead.destination_or_product
        ),
        "_blank"
      );
      fetch("/api/sales-follow-up/log-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, phone: lead.phone_number }),
      }).catch(() => {});

      const res = await fetch(`/api/sales-follow-up/leads/${lead.id}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          status: "No Response",
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFollowUpFail"));

      const followUp = result.followUp as { id: string; follow_up_number: number };
      setPendingQuick((prev) => ({
        ...prev,
        [lead.id]: {
          followUpId: followUp.id,
          totalFollowUps: followUp.follow_up_number,
        },
      }));

      toast(sf.toastFollowUpSaved, "success");
      setJustDoneId(lead.id);
      window.setTimeout(() => setJustDoneId((id) => (id === lead.id ? null : id)), 2500);
      // Keep all reports aligned: stats, leads, chart/performance and batch progress
      fetchStats();
      fetchLeads();
      fetchChartAndPerformance();
      fetchBatches();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFollowUpFail, "error");
    } finally {
      setFollowingUpId(null);
    }
  }

  async function handleQuickStatus(
    lead: SalesLeadWithLastFollowUp,
    status: FollowUpStatusType
  ) {
    const pending = pendingQuick[lead.id];
    if (!pending) return;
    setStatusUpdatingId(lead.id);
    try {
      const res = await fetch(`/api/sales-follow-up/follow-ups/${pending.followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFollowUpFail"));
      toast(sf.toastStatusUpdated, "success");
      if (pending.totalFollowUps < 3) {
        setPendingQuick((prev) => {
          const next = { ...prev };
          delete next[lead.id];
          return next;
        });
      }
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFollowUpFail, "error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleCompleteStatus(lead: SalesLeadWithLastFollowUp, status: LeadStatus) {
    setStatusUpdatingId(lead.id);
    try {
      const res = await fetch(`/api/sales-follow-up/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_status: status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "saveFail"));
      toast(sf.toastStatusUpdated, "success");
      setPendingQuick((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
      fetchLeads();
      fetchStats();
      fetchChartAndPerformance();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.saveFail, "error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleBulk(action: "delete" | "assign" | "follow_up") {
    if (selectedIds.length === 0 || bulkBusy) return;
    if (action === "assign" && !bulkAssignPicId) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/sales-follow-up/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          leadIds: selectedIds,
          picId: action === "assign" ? bulkAssignPicId : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(mapSalesFollowUpApiError(sf, result, "errGeneric"));
      toast(sfReplace(sf.toastBulkOk, { n: result.count ?? selectedIds.length }), "success");
      setSelectedIds([]);
      fetchLeads();
      fetchStats();
      fetchChartAndPerformance();
    } catch (err) {
      toast(err instanceof Error ? err.message : sf.errGeneric, "error");
    } finally {
      setBulkBusy(false);
    }
  }

  function handleExportCsv() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    if (status) params.set("status", status);
    if (followUpFilter && followUpFilter !== "all") params.set("followUpFilter", followUpFilter);
    if (packageFilter && packageFilter !== "all") params.set("packageFilter", packageFilter);
    if (selectedBatchId) params.set("batchId", selectedBatchId);
    params.set("format", "csv");
    window.open(`/api/sales-follow-up/export?${params.toString()}`, "_blank");
  }

  function handleExportFollowUpReport() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    if (status) params.set("status", status);
    if (followUpFilter && followUpFilter !== "all") params.set("followUpFilter", followUpFilter);
    if (packageFilter && packageFilter !== "all") params.set("packageFilter", packageFilter);
    params.set("format", "csv");
    params.set("report", "followups");
    window.open(`/api/sales-follow-up/export?${params.toString()}`, "_blank");
  }

  function handleExportPerfCsv() {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (picId) params.set("picId", picId);
    params.set("format", "csv");
    params.set("report", "performance");
    window.open(`/api/sales-follow-up/export?${params.toString()}`, "_blank");
  }

  function handleRefresh() {
    void (async () => {
      const ok = await checkHealth();
      if (!ok) return;
      fetchPics();
      fetchStats();
      fetchLeads();
      fetchChartAndPerformance();
    })();
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {setupError && (
        <div
          className="rounded-xl border px-5 py-5 space-y-4"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--surface-card)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" style={{ color: "var(--color-warning-600, #d97706)" }} />
            <div className="space-y-2 min-w-0">
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {sf.setupTitle}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {sf.setupBody}
              </p>
              <ol className="text-sm space-y-1 list-decimal pl-5" style={{ color: "var(--text-secondary)" }}>
                <li>{sf.setupStep1}</li>
                <li>{sf.setupStep2}</li>
                <li>{sf.setupStep3}</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copySetupSql}
              className="btn-primary-solid inline-flex items-center gap-2 text-sm"
            >
              {sqlCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {sqlCopied ? sf.sqlCopied : sf.copySql}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <RefreshCw className="size-4" />
              {sf.refreshBtn}
            </button>
          </div>

          <textarea
            readOnly
            value={SALES_FOLLOW_UP_SETUP_SQL}
            className="input-field w-full text-xs font-mono resize-y"
            style={{ minHeight: "140px" }}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}

      {/* Header — nipis, satu baris. Mobile: icon-only actions. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="page-title">
          {isSales ? sf.titleSales : sf.titleAdmin}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2 text-sm !min-h-[40px]"
            title={sf.refresh}
            aria-label={sf.refresh}
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            onClick={() => setShowWaTemplates(true)}
            className="btn-secondary flex items-center gap-2 text-sm font-semibold !min-h-[40px]"
            title={sf.editWaPretext}
          >
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline">{sf.editWaPretext}</span>
          </button>
          <button
            onClick={() => setShowUploadExcel(true)}
            className="btn-secondary flex items-center gap-2 text-sm font-semibold !min-h-[40px]"
            title={sf.uploadExcel}
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">{sf.uploadExcel}</span>
          </button>
          <button
            onClick={() => {
              setEditLead(null);
              setShowAddLead(true);
            }}
            className="btn-primary-solid flex items-center gap-2 text-sm font-bold !min-h-[40px]"
          >
            <Plus className="size-4" />
            {sf.addLead}
          </button>
        </div>
      </div>

      {/* Upload History / Batch — bahagian ATAS, selepas header */}
      <UploadHistoryTable
        batches={batches}
        loading={loadingBatches}
        showUploader={!isSales}
        isAdmin={!isSales}
        selectedBatchId={selectedBatchId || undefined}
        onSelectBatch={(batchId) => {
          // Toggle: klik batch aktif semula = clear (papar semua)
          setSelectedBatchId((prev) => (prev === batchId ? "" : batchId));
        }}
        onChanged={() => void fetchBatches()}
        onDeleteResult={({ id, scope, deletedLeads }) => {
          // Batch yang sedang dipilih dipadam — clear filter
          if (id === selectedBatchId) setSelectedBatchId("");
          if (scope === "with_leads" && deletedLeads > 0) {
            // Leads berubah — refresh semua data
            fetchLeads();
            fetchStats();
            fetchChartAndPerformance();
          }
        }}
      />

      {/* Chip batch aktif — clear untuk papar semua */}
      {selectedBatchId && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FolderOpen className="size-3.5" />
            {batches.find((b) => b.id === selectedBatchId)?.batchName || "Batch dipilih"}
            <button
              onClick={() => setSelectedBatchId("")}
              title="Tunjuk semua leads"
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="size-3.5" />
            </button>
          </span>
          <span className="text-xs text-muted-foreground">Jadual &amp; statistik di bawah mengikut batch ini</span>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        picId={picId}
        status={status}
        search={search}
        followUpFilter={followUpFilter}
        pics={pics}
        hidePicFilter={isSales}
        datePreset={datePreset}
        onDatePresetChange={(preset, newStart, newEnd) => {
          setDatePreset(preset);
          if (preset !== "custom") {
            setStartDate(newStart);
            setEndDate(newEnd);
          }
        }}
        onStartDateChange={(v) => {
          setStartDate(v);
          setDatePreset("custom");
        }}
        onEndDateChange={(v) => {
          setEndDate(v);
          setDatePreset("custom");
        }}
        onPicChange={setPicId}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        onFollowUpFilterChange={setFollowUpFilter}
      />

      <FollowUpStageTabs
        value={followUpFilter}
        onChange={(v: FollowUpStageValue) => setFollowUpFilter(v)}
        stats={stats}
      />

      <PackageFilterTabs
        value={packageFilter}
        onChange={(v: PackageFilterValue) => setPackageFilter(v)}
        packages={displayPackages}
      />

      {/* Chart & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpChart data={chartData} />
        <PicPerformanceTable
          data={performance}
          onExportCsv={handleExportCsv}
          onExportPerfCsv={handleExportPerfCsv}
          onExportFollowUpReport={handleExportFollowUpReport}
        />
      </div>

      {selectedIds.length > 0 && (
        <div
          className="surface-card rounded-xl px-4 py-3 flex flex-wrap items-center gap-2"
          style={{ borderColor: "var(--border-color)" }}
        >
          <span className="text-sm font-semibold mr-2" style={{ color: "var(--text-primary)" }}>
            {sfReplace(sf.bulkSelected, { n: selectedIds.length })}
          </span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulk("follow_up")}
            className="btn-primary-solid text-xs py-1.5 px-3"
          >
            {sf.bulkFollowUp}
          </button>
          {!isSales && (
            <>
              <select
                value={bulkAssignPicId}
                onChange={(e) => setBulkAssignPicId(e.target.value)}
                className="input-field text-xs py-1.5"
                style={{ minHeight: "32px" }}
              >
                <option value="">{sf.selectPic}</option>
                {pics.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={bulkBusy || !bulkAssignPicId}
                onClick={() => void handleBulk("assign")}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                {sf.bulkAssign}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulk("delete")}
            className="btn-secondary text-xs py-1.5 px-3 text-red-600"
          >
            {sf.bulkDelete}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs underline ml-auto"
            style={{ color: "var(--text-muted)" }}
          >
            {sf.bulkClear}
          </button>
        </div>
      )}

      {/* Leads Table */}
      <LeadTable
        leads={sortedLeads}
        loading={loadingLeads}
        canDelete
        showPicSelect={!isSales}
        followingUpId={followingUpId}
        justDoneId={justDoneId}
        pendingQuick={pendingQuick}
        selectedIds={selectedIds}
        statusUpdatingId={statusUpdatingId}
        sort={sort}
        onSortChange={handleSortChange}
        onToggleSelect={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )
        }
        onToggleSelectAll={() =>
          setSelectedIds((prev) =>
            prev.length === leads.length ? [] : leads.map((l) => l.id)
          )
        }
        onView={(lead) => router.push(`${detailBase}/${lead.id}`)}
        onAddFollowUp={(lead) => {
          void handleQuickFollowUp(lead);
        }}
        onEdit={(lead) => {
          setEditLead(lead as unknown as SalesLead);
          setShowAddLead(true);
        }}
        onDelete={handleDeleteLead}
        onQuickStatus={(lead, status) => {
          void handleQuickStatus(lead, status);
        }}
        onCompleteStatus={(lead, status) => {
          void handleCompleteStatus(lead, status);
        }}
        onDismissQuick={(leadId) =>
          setPendingQuick((prev) => {
            const next = { ...prev };
            delete next[leadId];
            return next;
          })
        }
      />

      {/* Modals */}
      <LeadFormModal
        open={showAddLead}
        onClose={() => {
          setShowAddLead(false);
          setEditLead(null);
        }}
        onSave={async (data) => {
          if (isSales && pics[0]?.id) {
            data.assigned_pic_id = pics[0].id;
          }
          if (editLead) {
            await handleUpdateLead(editLead.id, data);
          } else {
            await handleCreateLead(data);
          }
        }}
        pics={pics}
        editLead={editLead}
        lockPic={isSales}
      />

      <UploadExcelModal
        open={showUploadExcel}
        onClose={() => setShowUploadExcel(false)}
        pics={pics}
        lockPic={isSales}
        onSuccess={(summary) => {
          toast(
            sfReplace(sf.toastUploadOk, {
              inserted: summary.inserted,
              dup: summary.skippedDuplicate,
              owned: summary.skippedOwnedByOther ?? 0,
              invalid: summary.skippedInvalid,
            }),
            "success"
          );
          if (summary.packageColumnDetected === false) {
            toast(sf.toastUploadNoPackageCol, "error");
          }
          // Instant package tabs from this upload (all users)
          if (summary.packagesInserted && summary.packagesInserted.length > 0) {
            setPackages((prev) => {
              const map = new Map(prev.map((p) => [p.name, p.count]));
              for (const row of summary.packagesInserted!) {
                map.set(row.name, (map.get(row.name) ?? 0) + row.count);
              }
              return Array.from(map.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
            });
            setPackageFilter("all");
          }
          fetchLeads();
          fetchStats();
          fetchChartAndPerformance();
          fetchBatches();
        }}
      />

      <SfuWaTemplatesModal
        open={showWaTemplates}
        onClose={() => setShowWaTemplates(false)}
        onSaved={(templates) => {
          setWaTemplates(templates);
          toast(sf.toastWaSaved, "success");
        }}
      />
    </div>
  );
}
