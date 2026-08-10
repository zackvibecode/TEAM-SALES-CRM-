"use client";

import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/sales-follow-up/types";
import { leadStatusLabel } from "@/lib/sales-follow-up/labels";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

const STATUS_STYLES: Record<string, string> = {
  New: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  "Follow-Up": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  Interested: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  KIV: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  "No Response": "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  "Not Interested": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  Booked: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  Closed: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50",
};

export function SalesLeadStatusBadge({ status }: { status: LeadStatus }) {
  const { t } = useAppLocale();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] || STATUS_STYLES["New"]
      )}
    >
      {leadStatusLabel(t.salesFollowUp, status)}
    </span>
  );
}
