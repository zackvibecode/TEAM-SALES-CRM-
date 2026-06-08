export type FollowUpFilterTab =
  | "today"
  | "tomorrow"
  | "yesterday"
  | "week"
  | "custom"
  | "all";

export function filterTabLabel(tab: FollowUpFilterTab): string {
  const labels: Record<FollowUpFilterTab, string> = {
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    week: "This Week",
    custom: "Custom Date",
    all: "All",
  };
  return labels[tab];
}

/** Date helpers for follow-up filters (Asia/Kuala_Lumpur style: local server date). */

export function toDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function tomorrow(): string {
  return addDays(new Date(), 1);
}

/** True when an ISO timestamp falls on the same local calendar day as `base`. */
export function isSameCalendarDay(iso: string, base: Date = new Date()): boolean {
  return toDateString(new Date(iso)) === toDateString(base);
}

export function in3Days(): string {
  return addDays(new Date(), 3);
}

export function nextWeek(): string {
  return addDays(new Date(), 7);
}

export function startOfWeek(d: Date = new Date()): string {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  return toDateString(copy);
}

export function endOfWeek(d: Date = new Date()): string {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay() + 6);
  return toDateString(copy);
}
