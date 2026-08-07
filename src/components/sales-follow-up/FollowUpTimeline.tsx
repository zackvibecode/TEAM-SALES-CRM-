"use client";

import { Clock, CheckCircle2, AlertCircle, User } from "lucide-react";
import { formatDateMY } from "@/lib/sales-follow-up/dates";
import type { LeadFollowUp } from "@/lib/sales-follow-up/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "No Response": <AlertCircle className="size-4 text-orange-500" />,
  Replied: <CheckCircle2 className="size-4 text-blue-500" />,
  Interested: <CheckCircle2 className="size-4 text-green-500" />,
  KIV: <Clock className="size-4 text-purple-500" />,
  "Not Interested": <AlertCircle className="size-4 text-red-500" />,
  Booked: <CheckCircle2 className="size-4 text-emerald-500" />,
  "Need Follow-Up": <Clock className="size-4 text-amber-500" />,
  "Wrong Number": <AlertCircle className="size-4 text-gray-500" />,
};

interface FollowUpTimelineProps {
  followUps: LeadFollowUp[];
  emptyMessage?: string;
}

export function FollowUpTimeline({ followUps, emptyMessage }: FollowUpTimelineProps) {
  if (followUps.length === 0) {
    return (
      <div
        className="text-center py-10 surface-card rounded-xl"
        style={{ color: "var(--text-muted)" }}
      >
        <Clock className="size-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">{emptyMessage || "Tiada rekod follow-up."}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div
        className="absolute left-[15px] top-0 bottom-0 w-px"
        style={{ backgroundColor: "var(--border-color)" }}
      />

      <div className="space-y-6">
        {followUps.map((fu, idx) => {
          const isLatest = idx === followUps.length - 1;
          const fuNumber = fu.follow_up_number;
          const label = fuNumber <= 3 ? `Follow-Up ${fuNumber}` : `Follow-Up ${fuNumber}`;

          return (
            <div key={fu.id} className="relative">
              <div
                className="absolute -left-8 top-1 flex items-center justify-center size-[14px] rounded-full border-2"
                style={{
                  backgroundColor: isLatest ? "var(--color-brand-500, #9fe870)" : "var(--surface-card)",
                  borderColor: isLatest ? "var(--color-brand-500, #9fe870)" : "var(--border-color)",
                }}
              />

              <div className="surface-card rounded-xl p-4 border border-[var(--border-color)]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: fuNumber <= 3 ? "var(--color-brand-50, #f6fbef)" : "var(--color-success-50, #f0fdf4)",
                        color: fuNumber <= 3 ? "var(--color-brand-700, #3d6b00)" : "var(--color-success-700, #15803d)",
                        border: `1px solid ${fuNumber <= 3 ? "var(--color-brand-200, #d4edb3)" : "var(--color-success-200, #bbf7d0)"}`,
                      }}
                    >
                      {label}
                    </span>
                    {STATUS_ICONS[fu.status] || <AlertCircle className="size-4 text-gray-400" />}
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {fu.status}
                    </span>
                  </div>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatDateMY(fu.follow_up_date)}
                  </span>
                </div>

                {fu.response && (
                  <p
                    className="text-sm mb-2 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      Respon:{" "}
                    </span>
                    {fu.response}
                  </p>
                )}

                {fu.notes && (
                  <p
                    className="text-sm mb-2 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      Nota:{" "}
                    </span>
                    {fu.notes}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-color)]">
                  {fu.pic && (
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {fu.pic.name}
                      </span>
                    </div>
                  )}
                  {fu.next_follow_up_date && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Seterusnya: {formatDateMY(fu.next_follow_up_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
