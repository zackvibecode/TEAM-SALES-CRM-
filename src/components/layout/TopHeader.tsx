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
      <div className="h-14 lg:h-16 flex items-center px-4 lg:px-6 gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface-hover)] shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        </button>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="hidden lg:inline-flex p-2 rounded-xl hover:bg-[var(--surface-hover)] shrink-0"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base lg:text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
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
            <Sun className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`theme-toggle-btn ${theme === "dark" ? "theme-toggle-btn-active" : ""}`}
            aria-label="Dark mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          className="relative p-2 rounded-xl hover:bg-[var(--surface-hover)] shrink-0 hidden sm:flex"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3b66ff]" />
        </button>

        <div className="flex items-center gap-2 shrink-0 pl-1">
          <div className="w-9 h-9 rounded-full bg-[#3b66ff] flex items-center justify-center text-white text-sm font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-sm font-semibold truncate max-w-[120px]" style={{ color: "var(--text-primary)" }}>
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
