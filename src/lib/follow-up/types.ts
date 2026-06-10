export type FollowUpStatus = "pending" | "completed" | "overdue";
export type LeadFollowUpStatus = "none" | "pending" | "completed" | "overdue";

export type ActivityLogActionType =
  | "whatsapp_clicked"
  | "initial_contact"
  | "follow_up_clicked"
  | "follow_up_scheduled"
  | "follow_up_completed"
  | "follow_up_overdue"
  | "whatsapp_rate_limit_warning";

export type WhatsAppRateLimitWarningOutcome = "shown" | "wait" | "continue";

export interface FollowUpRow {
  id: string;
  lead_id: string;
  sales_user_id: string | null;
  sales_user_name: string | null;
  follow_up_number: number;
  follow_up_date: string;
  status: FollowUpStatus;
  note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    name: string;
    whatsapp: string;
    campaign_name: string | null;
    owner_user_id: string;
    assigned_sales_user_name: string | null;
    last_contacted_at: string | null;
    last_followed_up_at: string | null;
    whatsapp_click_count: number;
    follow_up_count: number;
    follow_up_status: LeadFollowUpStatus;
    next_follow_up_date: string | null;
    follow_up_notes: string | null;
    clicked_at?: string | null;
  };
}

export interface ActivityLogRow {
  id: string;
  lead_id: string;
  sales_user_id: string | null;
  sales_user_name: string | null;
  action_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FollowUpKpiStats {
  today: number;
  overdue: number;
  completed: number;
  total: number;
}

export type FollowUpSortKey =
  | "follow_up_date"
  | "last_followed_up"
  | "latest_activity"
  | "oldest_follow_up";
