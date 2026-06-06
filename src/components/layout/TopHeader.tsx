"use client";

import { Bell, Menu, Moon, PanelLeftOpen, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { getPageTitle } from "./nav-config";

export function TopHeader({
  role,
  pathname,
  userEmail,
  userName,
  sidebarOpen,
  onOpenMobile,
  onOpenSidebar,
}: {
  role: "admin" | "sales";
  pathname: string;
  userEmail: string;
  userName?: string;
  sidebarOpen: boolean;
  onOpenMobile: () => void;
  onOpenSidebar: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const pageTitle = getPageTitle(pathname);
  const displayName = userName || userEmail.split("@")[0] || "User";

  return (
    <header className="main-topbar sticky top-0 z-30 shrink-0">
      <div className="h-14 flex items-center px-4 lg:px-6 gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-md hover:bg-[var(--surface-hover)] shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="hidden lg:inline-flex p-2 rounded-md hover:bg-[var(--surface-hover)] shrink-0"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        )}

        <div className="min-w-0">
          <h1
            className="text-sm font-medium truncate tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {pageTitle}
          </h1>
        </div>

        <div className="flex-1" />

        <div className="theme-toggle shrink-0">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`theme-toggle-btn ${theme === "light" ? "theme-toggle-btn-active" : ""}`}
            aria-label="Light mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`theme-toggle-btn ${theme === "dark" ? "theme-toggle-btn-active" : ""}`}
            aria-label="Dark mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          className="relative p-2 rounded-md hover:bg-[var(--surface-hover)] shrink-0 hidden sm:flex"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--text-primary)" }}
          />
        </button>

        <div className="flex items-center gap-2 shrink-0 pl-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border"
            style={{
              background: "var(--surface-muted)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block min-w-0">
            <p
              className="text-[13px] font-medium truncate max-w-[120px]"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </p>
            <p className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>
              {role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
