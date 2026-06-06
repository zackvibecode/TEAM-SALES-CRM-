import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
  subtitle,
  className,
  fillHeight = false,
}: {
  title?: string;
  items: ActivityItem[];
  emptyMessage?: string;
  subtitle?: string;
  className?: string;
  fillHeight?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-padded-sm h-full flex flex-col min-h-0 w-full",
        fillHeight && "min-h-[280px]",
        className
      )}
    >
      <div className="mb-4 shrink-0">
        <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <span className="icon-stat text-amber-500">
            <Trophy />
          </span>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm py-8 text-center flex-1" style={{ color: "var(--text-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <ol
          className={cn(
            "space-y-3 flex-1 min-h-0 overflow-y-auto",
            fillHeight && items.length > 0 && "flex flex-col justify-between"
          )}
        >
          {items.map((item, i) => {
            const rank = item.rank ?? i + 1;
            const isFirst = rank === 1;

            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
                    isFirst
                      ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300/50"
                      : "bg-[#3b66ff] text-white"
                  )}
                >
                  {isFirst ? <Crown className="w-4 h-4" /> : rank}
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
            );
          })}
        </ol>
      )}
    </div>
  );
}
