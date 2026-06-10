"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", href: "/dashboard/rotator-team" },
  { label: "Landing Pages", href: "/dashboard/rotator-team/pages" },
  { label: "Sales Team", href: "/dashboard/rotator-team/sales" },
];

export function RotatorSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="inline-flex flex-wrap gap-1 p-1.5 rounded-2xl border w-fit max-w-full"
      style={{
        background: "var(--surface-card)",
        borderColor: "var(--border-color)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {tabs.map((tab) => {
        const active =
          tab.href === "/dashboard/rotator-team"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap",
              active
                ? "bg-[#3b66ff] text-white shadow-[0_2px_8px_-2px_rgba(59,102,255,0.5)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
