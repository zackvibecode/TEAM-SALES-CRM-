"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ActivityLogItem } from "./ActivityLogItem";
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
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Activity
                </h3>
                {activities.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity logged yet.</p>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3">
                    {activities.map((a) => (
                      <ActivityLogItem key={a.id} item={a} />
                    ))}
                  </div>
                )}
              </section>

              {followUps.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Scheduled follow ups
                  </h3>
                  <ul className="space-y-2">
                    {followUps.map((fu) => (
                      <li key={fu.id} className="rounded-xl px-3 py-2.5 text-sm bg-slate-50 border border-slate-200/80">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                          <span className="font-medium">#{fu.follow_up_number}</span>
                          <span>{fu.follow_up_date}</span>
                          <span className="text-slate-500 capitalize">{fu.status}</span>
                        </div>
                        {fu.note && <p className="text-slate-600 mt-1 text-xs">{fu.note}</p>}
                        {fu.sales_user_name && (
                          <p className="text-xs text-slate-400 mt-1">{fu.sales_user_name}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <button type="button" onClick={onClose} className="btn-secondary w-full mt-4 shrink-0">
          Close
        </button>
      </div>
    </div>
  );
}
