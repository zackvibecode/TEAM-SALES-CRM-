import { Trophy } from "lucide-react";

export interface ActivityItem {
  id: string;
  name: string;
  detail: string;
  meta?: string;
  rank?: number;
}

export function RecentActivityCard({
  title = "Top performers",
  items,
  emptyMessage = "No activity yet.",
}: {
  title?: string;
  items: ActivityItem[];
  emptyMessage?: string;
}) {
  return (
    <div className="card-padded-sm h-full flex flex-col">
      <h2 className="font-bold text-sm flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
        <span className="icon-stat text-amber-500">
          <Trophy />
        </span>
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm py-8 text-center flex-1" style={{ color: "var(--text-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <ol className="space-y-3 flex-1">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#3b66ff] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {item.rank ?? i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {item.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {item.detail}
                </p>
              </div>
              {item.meta && (
                <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {item.meta}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
