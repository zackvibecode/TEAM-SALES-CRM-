"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import type { LeadSource } from "@/types";

interface LeadSourceManagerProps {
  labels: {
    title: string;
    subtitle: string;
    addNew: string;
    edit: string;
    sourceName: string;
    namePlaceholder: string;
    active: string;
    inactive: string;
    noSources: string;
    deleteConfirm: string;
    alreadyExists: string;
    syncedNote: string;
    save: string;
    cancel: string;
    delete: string;
  };
}

export function LeadSourceManager({ labels }: LeadSourceManagerProps) {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeadSource | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lead-sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIsActive(true);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (source: LeadSource) => {
    setEditing(source);
    setName(source.name);
    setIsActive(source.is_active);
    setError("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Source name is required");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/lead-sources/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), is_active: isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }
      } else {
        const res = await fetch("/api/admin/lead-sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), is_active: isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
      }
      setModalOpen(false);
      await fetchSources();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/lead-sources/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        await fetchSources();
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {labels.title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {labels.subtitle}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          {labels.addNew}
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}>
        <Shield className="w-3.5 h-3.5 shrink-0" />
        {labels.syncedNote}
      </div>

      {loading && (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      )}

      {!loading && sources.length === 0 && (
        <div className="surface-card card-padded text-center py-10">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{labels.noSources}</p>
        </div>
      )}

      {!loading && sources.length > 0 && (
        <div className="table-shell overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="table-th text-left">{labels.sourceName}</th>
                <th className="table-th text-center">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b transition"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                    {source.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: source.is_active ? "#22c55e20" : "#ef444420",
                        color: source.is_active ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {source.is_active ? labels.active : labels.inactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(source)}
                        className="btn-ghost p-1.5"
                        title={labels.edit}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(source.id)}
                        className="btn-ghost p-1.5 text-red-500 hover:text-red-600"
                        title={labels.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="surface-card w-full max-w-sm rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
              {editing ? labels.edit : labels.addNew}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="alert-error text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  {labels.sourceName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder={labels.namePlaceholder}
                  required
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#9fe870]"
                />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {labels.active}
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  {labels.cancel}
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : labels.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
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
                {labels.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
