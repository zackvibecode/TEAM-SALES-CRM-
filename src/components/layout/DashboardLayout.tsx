"use client";

import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import type { NavItem } from "./nav-config";

export function MobileSidebar({
  open,
  onClose,
  navItems,
  pathname,
  role,
  userEmail,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  pathname: string;
  role: "admin" | "sales";
  userEmail: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div className="lg:hidden">
        <AppSidebar
          navItems={navItems}
          pathname={pathname}
          role={role}
          userEmail={userEmail}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
          onCloseMobile={onClose}
          onLogout={onLogout}
          showCloseMobile
        />
      </div>
    </>
  );
}

export function DashboardLayout({
  children,
  role,
  pathname,
  userEmail,
  navItems,
  sidebarOpen,
  mobileOpen,
  onToggleSidebar,
  onOpenMobile,
  onCloseMobile,
  onLogout,
}: {
  children: React.ReactNode;
  role: "admin" | "sales";
  pathname: string;
  userEmail: string;
  navItems: NavItem[];
  sidebarOpen: boolean;
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen flex app-shell">
      <MobileSidebar
        open={mobileOpen}
        onClose={onCloseMobile}
        navItems={navItems}
        pathname={pathname}
        role={role}
        userEmail={userEmail}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onLogout={onLogout}
      />

      <div className="hidden lg:block shrink-0">
        <AppSidebar
          navItems={navItems}
          pathname={pathname}
          role={role}
          userEmail={userEmail}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
          onLogout={onLogout}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 border-l border-[var(--border-color)]">
        <TopHeader
          role={role}
          pathname={pathname}
          userEmail={userEmail}
          sidebarOpen={sidebarOpen}
          onOpenMobile={onOpenMobile}
          onOpenSidebar={onToggleSidebar}
        />
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto overflow-y-auto bg-[var(--surface-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
