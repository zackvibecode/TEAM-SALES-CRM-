"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "./DashboardLayout";
import { getAdminNavItems, getSalesNavItems } from "./nav-config";
import { AppLocaleProvider, useAppLocale } from "@/components/i18n/AppLocaleProvider";

const SIDEBAR_STORAGE_KEY = "zaqone-sidebar-open";

function AppLayoutInner({ children, role }: { children: React.ReactNode; role: "admin" | "sales" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useAppLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const navItems = useMemo(
    () => (role === "admin" ? getAdminNavItems(t) : getSalesNavItems(t)),
    [role, t]
  );

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === "0") setSidebarOpen(false);
  }, []);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    }
    getUser();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      const next = !open;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <DashboardLayout
      role={role}
      pathname={pathname}
      userEmail={userEmail}
      navItems={navItems}
      sidebarOpen={sidebarOpen}
      mobileOpen={mobileOpen}
      onToggleSidebar={toggleSidebar}
      onOpenMobile={() => setMobileOpen(true)}
      onCloseMobile={() => setMobileOpen(false)}
      onLogout={handleLogout}
    >
      {children}
    </DashboardLayout>
  );
}

export default function AppLayout({ children, role }: { children: React.ReactNode; role: "admin" | "sales" }) {
  return (
    <AppLocaleProvider>
      <AppLayoutInner role={role}>{children}</AppLayoutInner>
    </AppLocaleProvider>
  );
}
