"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminResetData } from "@/components/admin/AdminResetData";
import type { NavItem } from "./nav-config";
import { logoutIcon } from "./nav-config";
import { PanelLeftClose } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

export function AppSidebar({
  navItems,
  pathname,
  role,
  userEmail,
  sidebarOpen,
  onToggleSidebar,
  onCloseMobile,
  onLogout,
  showCloseMobile,
}: {
  navItems: NavItem[];
  pathname: string;
  role: "admin" | "sales";
  userEmail: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseMobile?: () => void;
  onLogout: () => void;
  showCloseMobile?: boolean;
}) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col sidebar-panel transition-all duration-300 ease-in-out lg:rounded-2xl lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4",
        showCloseMobile
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
        sidebarOpen
          ? "lg:relative lg:w-[260px] lg:opacity-100"
          : "lg:-translate-x-full lg:w-0 lg:opacity-0 lg:overflow-hidden lg:pointer-events-none lg:fixed"
      )}
    >
      <div className="px-5 pt-6 pb-4 shrink-0 w-[260px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <BrandLogo size="sm" />
          </div>
          {showCloseMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label="Close menu"
            >
              <PanelLeftClose className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </button>
          )}
          {!showCloseMobile && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4 w-[260px]">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
          Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                active ? "sidebar-nav-active" : "hover:bg-[var(--surface-hover)]"
              )}
              style={active ? undefined : { color: "var(--text-secondary)" }}
            >
              <span className="nav-icon-wrap">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {role === "admin" && (
        <div className="px-3 pb-3 shrink-0 w-[260px]">
          <AdminResetData variant="sidebar" />
        </div>
      )}

      <div className="p-4 border-t shrink-0 w-[260px]" style={{ borderColor: "var(--border-color)" }}>
        {userEmail && (
          <p className="px-3 text-xs truncate mb-2" style={{ color: "var(--text-muted)" }} title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="nav-icon-wrap">{logoutIcon}</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
