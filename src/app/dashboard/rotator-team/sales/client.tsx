"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/DataTable";
import { SalesForm } from "@/components/rotator/SalesForm";
import type { RotatorSalesMember } from "@/types/rotator";

type MemberRow = RotatorSalesMember & {
  total_assigned: number;
  unique_clicks: number;
  duplicate_clicks: number;
};

export function RotatorSalesClient({ initialMembers }: { initialMembers: MemberRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RotatorSalesMember | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sales member?")) return;
    const res = await fetch(`/api/admin/rotator/sales?id=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert((await res.json()).error || "Delete failed");
  };

  const handleToggleActive = async (member: RotatorSalesMember) => {
    const res = await fetch("/api/admin/rotator/sales", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, is_active: !member.is_active }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-primary-solid text-sm"
        >
          + Add Sales Member
        </button>
      </div>

      {(showForm || editing) && (
        <SalesForm
          member={editing || undefined}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <DataTable
        data={initialMembers as unknown as Record<string, unknown>[]}
        searchKeys={["name", "phone"]}
        searchPlaceholder="Search sales team..."
        columns={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "rotation_order", label: "Order" },
          { key: "total_assigned", label: "Total Assigned" },
          { key: "unique_clicks", label: "Unique Clicks" },
          {
            key: "is_active",
            label: "Status",
            render: (row) => (
              <button
                type="button"
                onClick={() => handleToggleActive(row as unknown as RotatorSalesMember)}
                className={`text-xs font-medium ${row.is_active ? "text-emerald-600" : "text-slate-400"}`}
              >
                {row.is_active ? "Active" : "Inactive"}
              </button>
            ),
          },
          {
            key: "created_at",
            label: "Created",
            render: (row) => new Date(row.created_at as string).toLocaleDateString(),
          },
          {
            key: "actions",
            label: "Action",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditing(row as unknown as RotatorSalesMember); setShowForm(false); }}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id as string)}
                  className="text-xs text-red-600 hover:underline py-1 px-2"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
