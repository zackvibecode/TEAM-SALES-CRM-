import type { ActivityLogRow } from "@/lib/follow-up/types";

const ACTION_LABELS: Record<string, string> = {
  whatsapp_clicked: "WhatsApp clicked",
  initial_contact: "Initial contact",
  follow_up_clicked: "Follow up via WhatsApp",
  follow_up_scheduled: "Follow up scheduled",
  follow_up_completed: "Completed",
  follow_up_overdue: "Overdue",
};

export function ActivityLogItem({ item }: { item: ActivityLogRow }) {
  const label = ACTION_LABELS[item.action_type] ?? item.action_type;
  const when = new Date(item.created_at).toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex gap-3 py-3 border-b border-slate-100/80 last:border-0">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-sm text-slate-600">{item.message}</p>
        <p className="text-xs text-slate-400 mt-1">
          {when}
          {item.sales_user_name ? ` · ${item.sales_user_name}` : ""}
        </p>
      </div>
    </div>
  );
}
