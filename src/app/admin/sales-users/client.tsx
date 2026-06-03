"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, X, Target } from "lucide-react";
import type { UserProfile } from "@/types";

interface SalesUsersClientProps {
  initialUsers: UserProfile[];
}

export function SalesUsersClient({ initialUsers }: SalesUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [kpiUserId, setKpiUserId] = useState<string | null>(null);
  const [kpiClicks, setKpiClicks] = useState("");
  const [kpiConverts, setKpiConverts] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-sales-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setUsers([
        { id: data.user_id, email, full_name: fullName, role: "sales", created_at: new Date().toISOString() },
        ...users,
      ]);
      setShowModal(false);
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const openKpi = (u: UserProfile) => {
    setKpiUserId(u.id);
    setKpiClicks(u.kpi_monthly_clicks != null ? String(u.kpi_monthly_clicks) : "");
    setKpiConverts(u.kpi_monthly_converts != null ? String(u.kpi_monthly_converts) : "");
  };

  const saveKpi = async () => {
    if (!kpiUserId) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/update-kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: kpiUserId,
        kpiMonthlyClicks: kpiClicks ? parseInt(kpiClicks, 10) : null,
        kpiMonthlyConverts: kpiConverts ? parseInt(kpiConverts, 10) : null,
        adminId: user?.id,
      }),
    });
    if (res.ok) {
      setUsers(
        users.map((u) =>
          u.id === kpiUserId
            ? {
                ...u,
                kpi_monthly_clicks: kpiClicks ? parseInt(kpiClicks, 10) : null,
                kpi_monthly_converts: kpiConverts ? parseInt(kpiConverts, 10) : null,
              }
            : u
        )
      );
      setKpiUserId(null);
    } else alert((await res.json()).error || "Failed");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{users.length} sales users</div>
        <button onClick={() => setShowModal(true)} className="btn-primary-solid">
          <UserPlus className="w-4 h-4" />
          Add Sales User
        </button>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th text-center">KPI Clicks/mo</th>
                <th className="table-th text-center">KPI Converts/mo</th>
                <th className="table-th">Created</th>
                <th className="table-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-center">{u.kpi_monthly_clicks ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{u.kpi_monthly_converts ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.created_at).toLocaleDateString("en-MY")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openKpi(u)} className="btn-ghost text-xs py-1">
                      <Target className="w-3.5 h-3.5" /> KPI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Add Sales User</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="alert-error">{error}</div>}
              <input className="input-field" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="input-field" type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="submit" disabled={loading} className="btn-primary-solid w-full">{loading ? "..." : "Create"}</button>
            </form>
          </div>
        </div>
      )}

      {kpiUserId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h3 className="font-semibold">Monthly KPI targets</h3>
            <div>
              <label className="text-sm text-slate-600">Target clicks / month</label>
              <input type="number" className="input-field mt-1" value={kpiClicks} onChange={(e) => setKpiClicks(e.target.value)} min={0} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Target conversions / month</label>
              <input type="number" className="input-field mt-1" value={kpiConverts} onChange={(e) => setKpiConverts(e.target.value)} min={0} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setKpiUserId(null)} className="flex-1 border rounded-xl py-2 text-sm">Cancel</button>
              <button onClick={saveKpi} className="flex-1 btn-primary-solid">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
