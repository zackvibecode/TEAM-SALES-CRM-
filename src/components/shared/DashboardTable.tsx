import type { ReactNode } from "react";

interface DashboardTableProps {
  title?: string;
  header?: ReactNode;
  children: ReactNode;
}

export function DashboardTable({ title, header, children }: DashboardTableProps) {
  return (
    <div className="table-shell">
      {(title || header) && (
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          {header ?? (
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
          )}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
