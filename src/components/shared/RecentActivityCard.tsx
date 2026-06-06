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
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b shrink-0" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </span>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm py-8 text-center flex-1" style={{ color: "var(--text-muted)" }}>
          {emptyMessage}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          {items.map((item, i) => {
            const rank = item.rank ?? i + 1;
            const isFirst = rank === 1;
            const isSecond = rank === 2;
            const isThird = rank === 3;

            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition hover:bg-[var(--surface-hover)]",
                  isFirst && "bg-amber-50/60 dark:bg-amber-900/10"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                    isFirst
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-300"
                      : isSecond
                        ? "bg-slate-400 text-white"
                        : isThird
                          ? "bg-amber-700/60 text-white"
                          : "text-[10px] font-bold"
                  )}
                  style={rank > 3 ? { color: "var(--text-muted)" } : undefined}
                >
                  {isFirst ? <Crown className="w-3 h-3" /> : rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                  </p>
                  <p className="text-[11px] truncate leading-tight" style={{ color: "var(--text-muted)" }}>
                    {item.detail}
                  </p>
                </div>
                {item.meta && (
                  <span
                    className={cn(
                      "text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md",
                      item.meta === "You"
                        ? "bg-[#3b66ff]/10 text-[#3b66ff]"
                        : ""
                    )}
                    style={item.meta !== "You" ? { color: "var(--text-muted)" } : undefined}
                  >
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
