import { LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusColors: Record<LeadStatus, string> = {
  Pending: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  Clicked: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  "Follow Up": "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  Interested: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
  "Not Interested": "bg-red-50 text-red-700 ring-1 ring-red-200/80",
  "No Response": "bg-orange-50 text-orange-700 ring-1 ring-orange-200/80",
  Converted: "bg-primary-light text-primary ring-1 ring-primary-muted/80",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        statusColors[status] || statusColors.Pending
      )}
    >
      {status}
    </span>
  );
}
