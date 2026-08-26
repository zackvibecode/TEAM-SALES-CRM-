export type SubscriptionStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "payment_pending"
  | "unpaid";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "rejected";

export interface PaymentSettings {
  id: string;
  plan_name: string;
  plan_price: number;
  subscription_duration_days: number;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  qr_code_url: string | null;
  invoice_issuer_name: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  price: number;
  status: SubscriptionStatus;
  start_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  invoice_number: string | null;
  amount: number;
  plan_name: string;
  payment_method: string;
  receipt_path: string | null;
  payment_status: PaymentStatus;
  payment_date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subscription_start_date: string | null;
  subscription_expiry_date: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  payment_id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  plan_name: string;
  amount: number;
  invoice_date: string;
  subscription_start_date: string | null;
  subscription_expiry_date: string | null;
  payment_method: string;
  payment_status: string;
  pdf_url: string | null;
  created_at: string;
}

export interface PaymentWithInvoice extends Payment {
  invoice?: Invoice | null;
}

export type ReminderTier = 30 | 14 | 7 | 3 | 1 | 0;

export interface SubscriptionReminder {
  kind: "expiring" | "expired";
  daysRemaining: number;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}
