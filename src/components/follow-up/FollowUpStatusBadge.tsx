import { cn } from "@/lib/utils";

type Variant = "pending" | "completed" | "overdue" | "none" | "number";

export function FollowUpStatusBadge({
  status,
  number,
  className,
}: {
  status?: Variant;
  number?: number;
  className?: string;
}) {
  if (number != null) {
    return (
      <span
        className={cn(
          "inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          "bg-blue-100 text-blue-800 border border-blue-200/80",
          className
        )}
      >
        Follow Up #{number}
      </span>
    );
  }

  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-200/80",
    completed: "bg-emerald-100 text-emerald-900 border-emerald-200/80",
    overdue: "bg-red-100 text-red-900 border-red-200/80",
    none: "bg-slate-100 text-slate-600 border-slate-200/80",
  };

  const label =
    status === "pending"
      ? "Pending"
      : status === "completed"
        ? "Completed"
        : status === "overdue"
          ? "Overdue"
          : "None";

  return (
    <span
      className={cn(
        "inline-flex text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border",
        styles[status ?? "none"],
        className
      )}
    >
      {label}
    </span>
  );
}
