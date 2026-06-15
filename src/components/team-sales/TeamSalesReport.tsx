"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUpDown, TrendingUp, Users, DollarSign, Download } from "lucide-react";
import { TeamSaleFormModal } from "./TeamSaleFormModal";
import type { TeamSale } from "@/types";

interface TeamSalesReportProps {
  initialSales: TeamSale[];
  currentUserId: string;
  role: "admin" | "sales";
  salesUsers?: { id: string; full_name: string }[];
  labels: {
    title: string;
    subtitle: string;
    addSale: string;
    editSale: string;
    salesPerson: string;
    packageName: string;
    leadSource: string;
    saleAmount: string;
    notes: string;
    totalTeamSales: string;
    totalAmount: string;
    yourSales: string;
    save: string;
    cancel: string;
    date: string;
    actions: string;
    deleteConfirm: string;
    filterByUser: string;
    all: string;
    noSales: string;
    exportExcel: string;
  };
}

type SortField = "sales_user_name" | "package_name" | "lead_source" | "sale_amount" | "created_at";
type SortDir = "asc" | "desc";

export function TeamSalesReport({
  initialSales,
  currentUserId,
  role,
  salesUsers,
  labels,
}: TeamSalesReportProps) {
  const [sales, setSales] = useState<TeamSale[]>(initialSales);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamSale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterUserId, setFilterUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterUserId) params.set("userId", filterUserId);
      const res = await fetch(`/api/team-sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filterUserId]);

  useEffect(() => {
    if (filterUserId) {
      fetchSales();
    } else {
      setSales(initialSales);
    }
  }, [filterUserId, fetchSales, initialSales]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedSales = [...sales].sort((a, b) => {
    let va: string | number = "";
    let vb: string | number = "";
    switch (sortField) {
      case "sales_user_name":
        va = (a.sales_user_name || "").toLowerCase();
        vb = (b.sales_user_name || "").toLowerCase();
        break;
      case "package_name":
        va = a.package_name.toLowerCase();
        vb = b.package_name.toLowerCase();
        break;
      case "lead_source":
        va = a.lead_source.toLowerCase();
        vb = b.lead_source.toLowerCase();
        break;
      case "sale_amount":
        va = a.sale_amount;
        vb = b.sale_amount;
        break;
      case "created_at":
        va = a.created_at;
        vb = b.created_at;
        break;
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalAmount = sales.reduce((sum, s) => sum + s.sale_amount, 0);
  const mySales = sales.filter((s) => s.sales_user_id === currentUserId);
  const myAmount = mySales.reduce((sum, s) => sum + s.sale_amount, 0);

  const handleSave = async (data: {
    package_name: string;
    lead_source: string;
    sale_amount: number;
    notes: string;
    sales_user_id?: string;
  }) => {
    if (editing) {
      const res = await fetch(`/api/team-sales/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
    } else {
      const res = await fetch("/api/team-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
    }
    await fetchSales();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/team-sales/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      await fetchSales();
    }
  };

  const canEdit = (sale: TeamSale) =>
    role === "admin" || sale.sales_user_id === currentUserId;

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filterUserId) params.set("userId", filterUserId);
    const res = await fetch(`/api/team-sales/export?${params.toString()}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Timsel Report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="table-th cursor-pointer select-none hover:text-[var(--text-primary)] transition"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="page-title">{labels.title}</h2>
        <div className="flex items-center gap-3">
          {role === "admin" && salesUsers && salesUsers.length > 0 && (
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="input-field w-auto text-sm py-1.5"
            >
              <option value="">{labels.filterByUser || "All Users"}</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
          >
            <Download className="w-4 h-4" />
            {labels.exportExcel}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            {labels.addSale}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card card-padded flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#3b66ff]/10">
            <TrendingUp className="w-5 h-5 text-[#3b66ff]" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{labels.totalTeamSales}</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{sales.length}</p>
          </div>
        </div>
        <div className="surface-card card-padded flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{labels.totalAmount}</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              RM {totalAmount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="surface-card card-padded flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{labels.yourSales}</p>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {mySales.length} &middot; RM {myAmount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      )}

      {!loading && sortedSales.length === 0 && (
        <div className="surface-card card-padded text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{labels.noSales}</p>
        </div>
      )}

      {!loading && sortedSales.length > 0 && (
        <>
          <div className="table-shell overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <SortHeader field="sales_user_name">{labels.salesPerson}</SortHeader>
                  <SortHeader field="package_name">{labels.packageName}</SortHeader>
                  <SortHeader field="lead_source">{labels.leadSource}</SortHeader>
                  <SortHeader field="sale_amount">{labels.saleAmount}</SortHeader>
                  <SortHeader field="created_at">{labels.date}</SortHeader>
                  <th className="table-th">{labels.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b transition"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {sale.sales_user_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{sale.package_name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{sale.lead_source || "-"}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      RM {sale.sale_amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(sale.created_at).toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit(sale) && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditing(sale); setModalOpen(true); }}
                            className="btn-ghost p-1.5 text-xs"
                            title={labels.editSale}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(sale.id)}
                            className="btn-ghost p-1.5 text-xs text-red-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block sm:hidden space-y-3">
            {sortedSales.map((sale) => (
              <div key={sale.id} className="surface-card card-padded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {sale.sales_user_name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(sale.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {sale.package_name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {sale.lead_source || "-"}
                  </span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    RM {sale.sale_amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {canEdit(sale) && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setEditing(sale); setModalOpen(true); }}
                      className="btn-ghost text-xs py-1 px-3"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(sale.id)}
                      className="btn-ghost text-xs py-1 px-3 text-red-500"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <TeamSaleFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editing={editing}
        isAdmin={role === "admin"}
        salesUsers={salesUsers}
        labels={{
          addSale: labels.addSale,
          editSale: labels.editSale,
          packageName: labels.packageName,
          leadSource: labels.leadSource,
          saleAmount: labels.saleAmount,
          notes: labels.notes,
          salesPerson: labels.salesPerson,
          save: labels.save,
          cancel: labels.cancel,
        }}
      />

      {/* Delete confirmation modal */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="surface-card w-full max-w-sm rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
              {labels.deleteConfirm}
            </h3>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="btn-secondary flex-1"
              >
                {labels.cancel}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary flex-1"
                style={{ background: "#ef4444" }}
              >
                {labels.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
