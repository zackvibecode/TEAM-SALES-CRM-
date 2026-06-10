import type { RotatorImageSize } from "@/lib/rotator/display";

export const DEFAULT_ROTATOR_MESSAGE =
  "Hi Nusa Travel, saya berminat nak dapatkan maklumat lanjut tentang pakej.";

export interface RotatorPage {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  default_message: string;
  loading_text?: string;
  image_size?: RotatorImageSize | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RotatorSalesMember {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  rotation_order: number;
  created_at: string;
  updated_at: string;
}

export interface RotatorPageSales {
  id: string;
  rotator_page_id: string;
  sales_member_id: string;
  rotation_order: number;
  is_active: boolean;
  created_at: string;
}

export interface RotatorClick {
  id: string;
  rotator_page_id: string;
  sales_member_id: string | null;
  sales_name: string | null;
  sales_phone: string | null;
  whatsapp_message: string | null;
  visitor_id: string | null;
  source: string;
  campaign: string;
  referrer: string | null;
  user_agent: string | null;
  is_duplicate: boolean;
  clicked_at: string;
  created_at: string;
}

export interface RotatorAssignResult {
  success: boolean;
  error?: string;
  sales_member_id?: string;
  sales_name?: string;
  sales_phone?: string;
  whatsapp_message?: string;
  is_duplicate?: boolean;
}

export interface RotatorAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  pageId?: string;
  salesMemberId?: string;
  source?: string;
  campaign?: string;
}
