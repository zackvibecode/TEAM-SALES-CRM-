"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";
import { logoutIcon } from "./nav-config";
import { PanelLeftClose } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

export function AppSidebar({
  navItems,
  pathname,
  role: _role,
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
  const { t } = useAppLocale();
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full w-[240px] flex flex-col sidebar-panel transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen",
        showCloseMobile
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
        sidebarOpen
          ? "lg:relative lg:w-[240px] lg:opacity-100"
          : "lg:-translate-x-full lg:w-0 lg:opacity-0 lg:overflow-hidden lg:pointer-events-none lg:fixed"
      )}
    >
      <div className="px-4 h-14 flex items-center shrink-0 w-[240px] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <BrandLogo size="sm" />
          </div>
          {showCloseMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md hover:bg-[var(--surface-hover)]"
              aria-label="Close menu"
            >
              <PanelLeftClose className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          )}
          {!showCloseMobile && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:block p-1.5 rounded-md hover:bg-[var(--surface-hover)]"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto w-[240px]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors",
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

      <div className="p-3 border-t shrink-0 w-[240px]" style={{ borderColor: "var(--border-color)" }}>
        {userEmail && (
          <p className="px-2.5 text-[11px] truncate mb-2" style={{ color: "var(--text-muted)" }} title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium w-full transition hover:bg-[var(--surface-hover)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="nav-icon-wrap">{logoutIcon}</span>
          {t.common.logout}
        </button>
      </div>
    </aside>
  );
}
