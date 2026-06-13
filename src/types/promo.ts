export type PromoActivityAction = "created" | "updated" | "deleted";

export interface PromoDepartureEntry {
  name: string;
  date: string;
}

export interface PromoDepartureRow {
  name: string;
  date: string;
}

export interface Promo {
  id: string;
  title: string;
  promo_text: string;
  poster_url: string | null;
  is_active: boolean;
  sort_order: number;
  ends_at: string | null;
  departure_dates?: PromoDepartureEntry[] | string[] | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { full_name?: string; email?: string } | null;
  updater?: { full_name?: string; email?: string } | null;
}

export interface PromoActivityLog {
  id: string;
  promo_id: string | null;
  actor_id: string | null;
  action: PromoActivityAction;
  changes: Record<string, unknown>;
  created_at: string;
  actor?: { full_name?: string; email?: string } | null;
}

export interface PromoInput {
  title: string;
  promo_text: string;
  poster_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  ends_at?: string | null;
  departure_dates?: PromoDepartureEntry[];
}

export interface PromoCountdownResult {
  expired: boolean;
  totalMs: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}
