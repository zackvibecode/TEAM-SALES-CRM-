import {
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  List,
  Activity,
  ClipboardList,
  CalendarClock,
  KeyRound,
  Settings,
  MessageCircle,
  LogOut,
  RotateCw,
  Megaphone,
} from "lucide-react";
import type { AppCopy } from "@/lib/i18n/get-copy";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function getAdminNavItems(t: AppCopy): NavItem[] {
  return [
    { label: t.nav.dashboard, href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t.nav.salesUsers, href: "/admin/sales-users", icon: <Users className="w-4 h-4" /> },
    { label: t.nav.assignUpload, href: "/admin/upload", icon: <Upload className="w-4 h-4" /> },
    { label: t.nav.campaigns, href: "/admin/files", icon: <FileText className="w-4 h-4" /> },
    { label: t.nav.allLeads, href: "/admin/leads", icon: <List className="w-4 h-4" /> },
    { label: t.nav.promos, href: "/admin/promos", icon: <Megaphone className="w-4 h-4" /> },
    { label: t.nav.activityLog, href: "/admin/activity", icon: <Activity className="w-4 h-4" /> },
    { label: t.nav.followUpQueue, href: "/admin/follow-ups", icon: <CalendarClock className="w-4 h-4" /> },
    { label: t.nav.rotatorTeam, href: "/dashboard/rotator-team", icon: <RotateCw className="w-4 h-4" /> },
    { label: t.nav.auditLog, href: "/admin/audit", icon: <ClipboardList className="w-4 h-4" /> },
    { label: t.nav.aiApiKey, href: "/admin/api-key", icon: <KeyRound className="w-4 h-4" /> },
    { label: t.nav.settings, href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ];
}

export function getSalesNavItems(t: AppCopy): NavItem[] {
  return [
    { label: t.nav.dashboard, href: "/dashboard/sales", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t.nav.myTasks, href: "/dashboard/sales/customers", icon: <List className="w-4 h-4" /> },
    { label: t.nav.promos, href: "/dashboard/sales/promos", icon: <Megaphone className="w-4 h-4" /> },
    { label: t.nav.activityLog, href: "/dashboard/sales/activity", icon: <Activity className="w-4 h-4" /> },
    { label: t.nav.followUpQueue, href: "/dashboard/sales/follow-ups", icon: <CalendarClock className="w-4 h-4" /> },
    { label: t.nav.whatsappMessage, href: "/dashboard/sales/message", icon: <MessageCircle className="w-4 h-4" /> },
  ];
}

/** @deprecated Use getAdminNavItems(t) inside AppLayout */
export const adminNavItems: NavItem[] = [];

/** @deprecated Use getSalesNavItems(t) inside AppLayout */
export const salesNavItems: NavItem[] = [];

export const logoutIcon = <LogOut className="w-4 h-4" />;

export function getPageTitle(pathname: string, t: AppCopy): string {
  const titles = t.nav.pageTitles;
  if (titles[pathname]) return titles[pathname];
  for (const [path, title] of Object.entries(titles)) {
    if (pathname.startsWith(path)) return title;
  }
  return t.nav.dashboard;
}
