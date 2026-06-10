"use client";

import { useState } from "react";
import type { RotatorSalesMember } from "@/types/rotator";

interface SalesFormProps {
  member?: RotatorSalesMember;
  onSaved: () => void;
  onCancel: () => void;
}

export function SalesForm({ member, onSaved, onCancel }: SalesFormProps) {
  const [name, setName] = useState(member?.name || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [rotationOrder, setRotationOrder] = useState(member?.rotation_order?.toString() || "0");
  const [isActive, setIsActive] = useState(member?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/rotator/sales", {
        method: member ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(member ? { id: member.id } : {}),
          name,
          phone,
          rotation_order: Number(rotationOrder),
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-padded space-y-4">
      <h3 className="font-semibold">{member ? "Edit Sales Member" : "Add Sales Member"}</h3>

      <div>
        <label className="text-sm font-medium block mb-1">Name</label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Phone (no + symbol)</label>
        <input
          className="input-field"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="60123456789"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Rotation Order</label>
        <input
          type="number"
          className="input-field"
          value={rotationOrder}
          onChange={(e) => setRotationOrder(e.target.value)}
          min={0}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary-solid text-sm">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}
