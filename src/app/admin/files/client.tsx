"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Eye, UserCog, Archive, ArchiveRestore } from "lucide-react";
import Link from "next/link";
import { BatchProgressBar } from "@/components/shared/BatchProgressBar";
import type { UserProfile } from "@/types";

export interface FileItem {
  id: string;
  file_name: string;
  campaign_name: string | null;
  source_tag: string | null;
  owner_id: string;
  owner_name: string;
  total_rows: number;
  pending: number;
  progress: number;
  is_archived: boolean;
  created_at: string;
}

export function FilesClient({
  initialFiles,
  salesUsers,
}: {
  initialFiles: FileItem[];
  salesUsers: Pick<UserProfile, "id" | "full_name">[];
}) {
  const [files, setFiles] = useState(initialFiles);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState("");

  const handleDelete = async (fileId: string) => {
    if (!confirm("Delete this batch? All associated leads will be removed.")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/admin/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, adminId: user?.id }),
    });
    if (res.ok) setFiles(files.filter((f) => f.id !== fileId));
    else alert((await res.json()).error || "Delete failed");
  };

  const handleReassign = async () => {
    if (!reassignId || !newOwner) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/admin/reassign-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: reassignId, newOwnerUserId: newOwner, adminId: user?.id }),
    });
    if (res.ok) {
      const name = salesUsers.find((u) => u.id === newOwner)?.full_name || "Unknown";
      setFiles(files.map((f) => (f.id === reassignId ? { ...f, owner_id: newOwner, owner_name: name } : f)));
      setReassignId(null);
      setNewOwner("");
    } else alert((await res.json()).error || "Reassign failed");
  };

  const handleArchive = async (fileId: string, archived: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/admin/archive-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, archived, adminId: user?.id }),
    });
    if (res.ok) {
      setFiles(files.map((f) => (f.id === fileId ? { ...f, is_archived: archived } : f)));
    }
  };

  const active = files.filter((f) => !f.is_archived);
  const archived = files.filter((f) => f.is_archived);

  const renderTable = (items: FileItem[], showArchive: boolean) => (
    <div className="table-shell mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              <th className="table-th">Campaign / File</th>
              <th className="table-th">Source</th>
              <th className="table-th">Assigned to</th>
              <th className="table-th">Progress</th>
              <th className="table-th text-right">Leads</th>
              <th className="table-th">Uploaded</th>
              <th className="table-th text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="table-row">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{f.campaign_name || f.file_name}</div>
                  {f.campaign_name && f.campaign_name !== f.file_name && (
                    <div className="text-xs text-slate-400">{f.file_name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{f.source_tag || "—"}</td>
                <td className="px-4 py-3">{f.owner_name}</td>
                <td className="px-4 py-3 min-w-[140px]">
                  <BatchProgressBar
                    progress={f.progress}
                    pending={f.pending}
                    total={f.total_rows}
                    compact
                  />
                </td>
                <td className="px-4 py-3 text-right">{f.total_rows}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(f.created_at).toLocaleDateString("en-MY")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <Link href={`/admin/leads?batch=${f.id}`} className="btn-ghost text-xs py-1">
                      <Eye className="w-3.5 h-3.5" /> Leads
                    </Link>
                    <button
                      onClick={() => { setReassignId(f.id); setNewOwner(f.owner_id); }}
                      className="btn-ghost text-xs py-1"
                      title="Re-assign batch"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(f.id, showArchive)}
                      className="btn-ghost text-xs py-1"
                      title={showArchive ? "Archive" : "Restore"}
                    >
                      {showArchive ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  {showArchive ? "No active batches." : "No archived batches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
        Active batches
      </h2>
      {renderTable(active, true)}

      {archived.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Archived
          </h2>
          {renderTable(archived, false)}
        </>
      )}

      {reassignId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Re-assign batch</h3>
            <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="input-field">
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setReassignId(null)} className="flex-1 btn-ghost border border-slate-200">
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
