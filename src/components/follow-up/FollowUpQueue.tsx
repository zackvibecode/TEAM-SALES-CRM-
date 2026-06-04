"use client";

import { useCallback, useEffect, useState } from "react";
import { FollowUpFilters } from "./FollowUpFilters";
import { FollowUpQueueCard, openWhatsApp } from "./FollowUpQueueCard";
import { FollowUpModal } from "./FollowUpModal";
import { FollowUpHistoryModal } from "./FollowUpHistoryModal";
import { FollowUpKpiCards } from "./FollowUpKpiCards";
import type { FollowUpFilterTab } from "@/lib/follow-up/dates";
import { toDateString } from "@/lib/follow-up/dates";
import type { FollowUpRow, FollowUpSortKey } from "@/lib/follow-up/types";
import { Loader2 } from "lucide-react";

export function FollowUpQueue({
  role,
  salesUsers,
  whatsappPretext,
}: {
  role: "admin" | "sales";
  salesUsers?: { id: string; full_name: string }[];
  whatsappPretext?: string | null;
}) {
  const [filter, setFilter] = useState<FollowUpFilterTab>("today");
  const [customDate, setCustomDate] = useState(toDateString());
  const [sort, setSort] = useState<FollowUpSortKey>("follow_up_date");
  const [salesUserFilter, setSalesUserFilter] = useState("all");
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [scheduleTarget, setScheduleTarget] = useState<FollowUpRow | null>(null);
  const [postWaTarget, setPostWaTarget] = useState<{ leadId: string; leadName: string } | null>(
    null
  );
  const [historyTarget, setHistoryTarget] = useState<{ leadId: string; leadName: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, sort });
      if (filter === "custom" && customDate) {
        params.set("customDate", customDate);
      }
      if (role === "admin" && salesUserFilter !== "all") {
        params.set("salesUser", salesUserFilter);
      }
      const res = await fetch(`/api/follow-ups?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setRows(data.followUps ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, customDate, salesUserFilter, role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFollowUpWhatsApp = async (row: FollowUpRow) => {
    if (!row.lead) return;
    setBusy(true);
    try {
      const res = await fetch("/api/follow-ups/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpId: row.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      openWhatsApp(data.whatsapp, row.lead.name, whatsappPretext);
      setPostWaTarget({ leadId: row.lead.id, leadName: row.lead.name });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const handleScheduleConfirm = async (date: string | null, note: string) => {
    const leadId = scheduleTarget?.lead?.id ?? postWaTarget?.leadId;
    if (!leadId || !date) return;

    const res = await fetch("/api/follow-ups/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, followUpDate: date, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    await load();
  };

  return (
    <div className="space-y-6">
      <FollowUpKpiCards />

      <FollowUpFilters
        filter={filter}
        customDate={customDate}
        sort={sort}
        salesUserFilter={salesUserFilter}
        salesUsers={salesUsers}
        showSalesFilter={role === "admin"}
        onFilterChange={setFilter}
        onCustomDateChange={setCustomDate}
        onSortChange={setSort}
        onSalesUserChange={setSalesUserFilter}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card-padded-sm text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No follow ups in this view. Try another filter or contact leads via WhatsApp first.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((row) => (
            <FollowUpQueueCard
              key={row.id}
              row={row}
              showSalesUser={role === "admin"}
              busy={busy}
              onFollowUpWhatsApp={handleFollowUpWhatsApp}
              onSchedule={setScheduleTarget}
              onViewHistory={(r) =>
                setHistoryTarget({
                  leadId: r.lead!.id,
                  leadName: r.lead!.name,
                })
              }
            />
          ))}
        </div>
      )}

      <FollowUpModal
        open={!!scheduleTarget}
        title="Schedule next follow up"
        subtitle={scheduleTarget?.lead?.name}
        onClose={() => setScheduleTarget(null)}
        onConfirm={handleScheduleConfirm}
      />

      <FollowUpModal
        open={!!postWaTarget}
        title="Schedule next follow up?"
        subtitle={postWaTarget?.leadName}
        showSkip
        onClose={() => setPostWaTarget(null)}
        onConfirm={handleScheduleConfirm}
      />

      <FollowUpHistoryModal
        open={!!historyTarget}
        leadId={historyTarget?.leadId ?? null}
        leadName={historyTarget?.leadName ?? ""}
        onClose={() => setHistoryTarget(null)}
      />
    </div>
  );
}
