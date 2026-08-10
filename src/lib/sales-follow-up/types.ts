export type PicStatus = "active" | "inactive";

export type LeadStatus =
  | "New"
  | "Follow-Up"
  | "Interested"
  | "KIV"
  | "No Response"
  | "Not Interested"
  | "Booked"
  | "Closed";

export type FollowUpStatusType =
  | "No Response"
  | "Replied"
  | "Interested"
  | "KIV"
  | "Not Interested"
  | "Booked"
  | "Need Follow-Up"
  | "Wrong Number";

export interface SalesPic {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: PicStatus;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesLead {
  id: string;
  customer_name: string;
  phone_number: string;
  normalized_phone_number: string;
  destination_or_product: string;
  source: string;
  assigned_pic_id: string | null;
  lead_status: LeadStatus;
  latest_response: string;
  next_follow_up_date: string | null;
  total_follow_ups: number;
  created_at: string;
  updated_at: string;
  assigned_pic?: SalesPic | null;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  pic_id: string | null;
  follow_up_number: number;
  follow_up_date: string;
  response: string;
  status: FollowUpStatusType;
  notes: string;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  pic?: SalesPic | null;
}

export interface SalesLeadWithLastFollowUp extends SalesLead {
  last_follow_up_date?: string | null;
  /** Exact time of last follow-up from lead_follow_ups.created_at */
  last_follow_up_at?: string | null;
  /** Compact history for table expand (up to 3+) */
  recent_follow_ups?: Array<{
    id: string;
    follow_up_number: number;
    status: FollowUpStatusType;
    created_at: string;
  }>;
}

export interface DashboardStats {
  total_leads: number;
  total_follow_ups: number;
  followed_up_once: number;
  followed_up_three: number;
  no_follow_up: number;
  overdue: number;
  /** Exact count: total_follow_ups === 1 */
  follow_up_1: number;
  /** Exact count: total_follow_ups === 2 */
  follow_up_2: number;
}

export interface PicPerformanceRow {
  pic_id: string;
  pic_name: string;
  leads_assigned: number;
  total_follow_up_activities: number;
  leads_followed_up: number;
  leads_with_three_plus: number;
  no_follow_up: number;
  overdue: number;
  completion_rate: number;
}

export interface ChartDataPoint {
  pic_id: string;
  pic_name: string;
  total_activities: number;
  leads_assigned: number;
  leads_followed_up: number;
  leads_three_plus: number;
}

export interface FollowUpFilterParams {
  startDate?: string;
  endDate?: string;
  picId?: string;
  status?: LeadStatus;
  search?: string;
  followUpFilter?:
    | "all"
    | "0"
    | "1"
    | "2"
    | "3+"
    | "overdue"
    | "due_today"
    | "not_today";
}

export interface CreateLeadInput {
  customer_name: string;
  phone_number: string;
  destination_or_product?: string;
  source?: string;
  assigned_pic_id?: string;
  lead_status?: LeadStatus;
  next_follow_up_date?: string;
  notes?: string;
}

export interface UpdateLeadInput {
  customer_name?: string;
  phone_number?: string;
  destination_or_product?: string;
  source?: string;
  assigned_pic_id?: string | null;
  lead_status?: LeadStatus;
  next_follow_up_date?: string | null;
}

export interface CreateFollowUpInput {
  lead_id: string;
  pic_id?: string;
  /** Optional — server auto-sets to today (KL) when omitted */
  follow_up_date?: string;
  response?: string;
  status?: FollowUpStatusType;
  notes?: string;
  next_follow_up_date?: string | null;
}

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "New", label: "Baru", color: "slate" },
  { value: "Follow-Up", label: "Follow-Up", color: "amber" },
  { value: "Interested", label: "Berminat", color: "blue" },
  { value: "KIV", label: "KIV", color: "purple" },
  { value: "No Response", label: "Tiada Respon", color: "orange" },
  { value: "Not Interested", label: "Tidak Berminat", color: "red" },
  { value: "Booked", label: "Booked", color: "green" },
  { value: "Closed", label: "Closed", color: "gray" },
];

export const FOLLOW_UP_STATUS_OPTIONS: { value: FollowUpStatusType; label: string }[] = [
  { value: "No Response", label: "Tiada Respon" },
  { value: "Replied", label: "Dibalas" },
  { value: "Interested", label: "Berminat" },
  { value: "KIV", label: "KIV" },
  { value: "Not Interested", label: "Tidak Berminat" },
  { value: "Booked", label: "Booked" },
  { value: "Need Follow-Up", label: "Perlu Follow-Up" },
  { value: "Wrong Number", label: "Salah Nombor" },
];

export const FOLLOW_UP_FILTER_OPTIONS = [
  { value: "all", label: "Semua Lead" },
  { value: "0", label: "Belum Follow-Up" },
  { value: "1", label: "1 Kali Follow-Up" },
  { value: "2", label: "2 Kali Follow-Up" },
  { value: "3+", label: "Minimum 3 Follow-Up" },
  { value: "due_today", label: "Perlu Follow Hari Ini" },
  { value: "not_today", label: "Belum FU Hari Ini" },
  { value: "overdue", label: "Overdue" },
] as const;
