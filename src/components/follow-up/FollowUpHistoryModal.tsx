"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ActivityLogItem } from "./ActivityLogItem";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import type { ActivityLogRow } from "@/lib/follow-up/types";

interface HistoryFollowUp {
  id: string;
  follow_up_number: number;
  follow_up_date: string;
  status: string;
  note: string | null;
  completed_at: string | null;
  sales_user_name: string | null;
}

export function FollowUpHistoryModal({
  open,
  leadId,
  leadName,
  onClose,
}: {
  open: boolean;
  leadId: string | null;
  leadName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLogRow[]>([]);
  const [followUps, setFollowUps] = useState<HistoryFollowUp[]>([]);

  useEffect(() => {
    if (!open || !leadId) return;
    setLoading(true);
    fetch(`/api/follow-ups/history?leadId=${leadId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setActivities(d.activities ?? []);
        setFollowUps(d.followUps ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, leadId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="card rounded-2xl w-full max-w-lg shadow-xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex justify-between mb-4 shrink-0">
          <div>
            <h2 className="font-semibold text-slate-900">Follow up history</h2>
            <p className="text-sm text-slate-500">{leadName}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Scheduled follow ups
                </h3>
                {followUps.length === 0 ? (
                  <p className="text-sm text-slate-500">No follow ups yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {followUps.map((fu) => (
                      <li key={fu.id} className="glass rounded-xl px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <FollowUpStatusBadge number={fu.follow_up_number} />
                          <FollowUpStatusBadge status={fu.status as "pending"} />
                          <span className="text-slate-500">{fu.follow_up_date}</span>
                        </div>
                        {fu.note && <p className="text-slate-600 mt-1">{fu.note}</p>}
                        {fu.sales_user_name && (
                          <p className="text-xs text-slate-400 mt-1">{fu.sales_user_name}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Activity timeline
                </h3>
                {activities.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity logged yet.</p>
                ) : (
                  activities.map((a) => <ActivityLogItem key={a.id} item={a} />)
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
