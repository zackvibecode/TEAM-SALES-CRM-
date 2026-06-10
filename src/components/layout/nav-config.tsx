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
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Sales Users", href: "/admin/sales-users", icon: <Users className="w-4 h-4" /> },
  { label: "Assign / Upload", href: "/admin/upload", icon: <Upload className="w-4 h-4" /> },
  { label: "Campaigns", href: "/admin/files", icon: <FileText className="w-4 h-4" /> },
  { label: "All Leads", href: "/admin/leads", icon: <List className="w-4 h-4" /> },
  { label: "Activity Log", href: "/admin/activity", icon: <Activity className="w-4 h-4" /> },
  { label: "Follow Up Queue", href: "/admin/follow-ups", icon: <CalendarClock className="w-4 h-4" /> },
  { label: "Rotator Team", href: "/dashboard/rotator-team", icon: <RotateCw className="w-4 h-4" /> },
  { label: "Audit Log", href: "/admin/audit", icon: <ClipboardList className="w-4 h-4" /> },
  { label: "AI API Key", href: "/admin/api-key", icon: <KeyRound className="w-4 h-4" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
];

export const salesNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/sales", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "My Tasks", href: "/dashboard/sales/customers", icon: <List className="w-4 h-4" /> },
  { label: "Activity Log", href: "/dashboard/sales/activity", icon: <Activity className="w-4 h-4" /> },
  { label: "Follow Up Queue", href: "/dashboard/sales/follow-ups", icon: <CalendarClock className="w-4 h-4" /> },
  { label: "WhatsApp Message", href: "/dashboard/sales/message", icon: <MessageCircle className="w-4 h-4" /> },
];

export const logoutIcon = <LogOut className="w-4 h-4" />;

export const routeTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/sales-users": "Sales Users",
  "/admin/upload": "Assign / Upload",
  "/admin/files": "Campaigns",
  "/admin/leads": "All Leads",
  "/admin/activity": "Activity Log",
  "/admin/follow-ups": "Follow Up Queue",
  "/dashboard/rotator-team": "Rotator Team",
  "/admin/audit": "Audit Log",
  "/admin/api-key": "AI API Key",
  "/admin/settings": "Settings",
  "/dashboard/sales": "Dashboard",
  "/dashboard/sales/customers": "My Tasks",
  "/dashboard/sales/activity": "Activity Log",
  "/dashboard/sales/follow-ups": "Follow Up Queue",
  "/dashboard/sales/message": "WhatsApp Message",
};

export function getPageTitle(pathname: string) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  for (const [path, title] of Object.entries(routeTitles)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Dashboard";
}
