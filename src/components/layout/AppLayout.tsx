"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  List,
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Sales Users", href: "/admin/sales-users", icon: <Users className="w-4 h-4" /> },
  { label: "Assign / Upload", href: "/admin/upload", icon: <Upload className="w-4 h-4" /> },
  { label: "Campaigns", href: "/admin/files", icon: <FileText className="w-4 h-4" /> },
  { label: "All Leads", href: "/admin/leads", icon: <List className="w-4 h-4" /> },
  { label: "Activity Log", href: "/admin/activity", icon: <Activity className="w-4 h-4" /> },
  { label: "Audit Log", href: "/admin/audit", icon: <ClipboardList className="w-4 h-4" /> },
];

const salesNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/sales", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Tasks", href: "/dashboard/sales/customers", icon: <List className="w-4 h-4" /> },
];

function BrandMark() {
  return (
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-2xl glass-strong flex items-center justify-center">
        <span className="text-lg font-extrabold text-blue-600">Z</span>
      </div>
    </div>
  );
}

export default function AppLayout({ children, role }: { children: React.ReactNode; role: "admin" | "sales" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const navItems = role === "admin" ? adminNavItems : salesNavItems;

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex app-shell p-0 lg:p-4 lg:gap-4">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full lg:h-[calc(100vh-2rem)] w-[260px] flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 sidebar-panel rounded-none lg:rounded-3xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark />
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-base block truncate">Zaqone CRM</span>
              <span className="text-[11px] text-blue-600/80 font-medium">by Zack</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Menu</p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                  active ? "sidebar-nav-active" : "text-slate-600 hover:bg-white/60"
                )}
              >
                <span className="nav-icon-wrap">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/80">
          {userEmail && (
            <p className="px-3 text-xs text-slate-500 truncate mb-2" title={userEmail}>
              {userEmail}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-white/70 w-full transition"
          >
            <span className="nav-icon-wrap">
              <LogOut className="w-4 h-4" />
            </span>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:rounded-3xl overflow-hidden">
        <header className="main-topbar sticky top-0 z-30 shrink-0 rounded-none lg:rounded-t-3xl">
          <div className="h-14 lg:h-16 flex items-center px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 mr-3 p-2 rounded-2xl glass"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="hidden sm:block text-sm font-semibold text-slate-800">
              Zaqone CRM
              <span className="text-slate-400 font-normal"> · {role === "admin" ? "Admin" : "Sales"}</span>
            </p>
            <div className="flex-1" />
            <span className="badge-role">{role}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1680px] w-full mx-auto overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
