export type UserRole = "admin" | "sales";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  kpi_monthly_clicks?: number | null;
  kpi_monthly_converts?: number | null;
  whatsapp_pretext?: string | null;
  created_at: string;
}

export interface UploadedFile {
  id: string;
  file_name: string;
  uploaded_by_admin_id: string;
  owner_user_id: string;
  total_rows: number;
  campaign_name?: string | null;
  source_tag?: string | null;
  is_archived?: boolean;
  created_at: string;
}

export type LeadStatus =
  | "Pending"
  | "Clicked"
  | "Follow Up"
  | "Interested"
  | "Not Interested"
  | "No Response"
  | "Converted";

export interface Lead {
  id: string;
  source_file_id: string | null;
  owner_user_id: string;
  name: string;
  whatsapp: string;
  email?: string | null;
  package_interest: string;
  notes: string;
  status: LeadStatus;
  clicked_at: string | null;
  clicked_by: string | null;
  follow_up_at?: string | null;
  campaign_name?: string | null;
  assigned_sales_user_name?: string | null;
  whatsapp_click_count?: number;
  follow_up_count?: number;
  last_contacted_at?: string | null;
  last_followed_up_at?: string | null;
  next_follow_up_date?: string | null;
  follow_up_status?: "none" | "pending" | "completed" | "overdue";
  follow_up_notes?: string | null;
  list_order?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BatchWithStats extends UploadedFile {
  owner_name: string;
  stats: {
    total: number;
    pending: number;
    clicked: number;
    converted: number;
    progress: number;
  };
}

export type ActivityType = "whatsapp_clicked" | "status_updated" | "note_updated";

export interface LeadActivity {
  id: string;
  lead_id: string;
  sales_user_id: string;
  activity_type: ActivityType;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  totalSalesUsers: number;
  totalUploadedFiles: number;
  totalCustomerData: number;
  totalClicked: number;
  totalPending: number;
  totalClicksToday: number;
  totalClicksThisWeek: number;
}

export interface SalesUserPerformance {
  id: string;
  full_name: string;
  email: string;
  total_data: number;
  clicked: number;
  pending: number;
  today_clicks: number;
  this_week_clicks: number;
  progress: number;
}

export interface SalesDashboardStats {
  totalData: number;
  pending: number;
  clicked: number;
  followUp: number;
  interested: number;
  notInterested: number;
  noResponse: number;
  converted: number;
  todayClicks: number;
  thisWeekClicks: number;
}

export interface LeadRow {
  name: string;
  whatsapp: string;
  package_interest: string;
  notes: string;
}