import type { Locale } from "@/lib/i18n/locale";
import type { PromoCountdownResult, PromoDepartureEntry, PromoDepartureRow } from "@/types/promo";

export const MYT_TIMEZONE = "Asia/Kuala_Lumpur";

/** Current instant as ms (same everywhere; display uses MYT). */
export function nowMs(): number {
  return Date.now();
}

function parseEndsAtMs(endsAt: string): number {
  return new Date(endsAt).getTime();
}

/** Calendar parts in MYT for a given instant. */
function getMYTParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Approximate calendar month/day diff between two dates in MYT. */
function calendarDiffMYT(from: Date, to: Date) {
  const a = getMYTParts(from);
  const b = getMYTParts(to);

  let months =
    (b.year - a.year) * 12 + (b.month - a.month);
  let days = b.day - a.day;

  if (days < 0) {
    months -= 1;
    const prevMonth = b.month === 1 ? 12 : b.month - 1;
    const prevYear = b.month === 1 ? b.year - 1 : b.year;
    const daysInPrev = new Date(prevYear, prevMonth, 0).getDate();
    days += daysInPrev;
  }

  if (months < 0) {
    return { months: 0, days: 0 };
  }

  return { months: Math.max(0, months), days: Math.max(0, days) };
}

interface CountdownLabels {
  month: string;
  months: string;
  day: string;
  days: string;
  hour: string;
  hours: string;
  minute: string;
  minutes: string;
  ended: string;
  approxPrefix: string;
}

const LABELS: Record<Locale, CountdownLabels> = {
  en: {
    month: "month",
    months: "months",
    day: "day",
    days: "days",
    hour: "hour",
    hours: "hours",
    minute: "minute",
    minutes: "minutes",
    ended: "Promo ended",
    approxPrefix: "",
  },
  bm: {
    month: "bulan",
    months: "bulan",
    day: "hari",
    days: "hari",
    hour: "jam",
    hours: "jam",
    minute: "minit",
    minutes: "minit",
    ended: "Promo tamat",
    approxPrefix: "",
  },
};

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function formatCountdownLabel(
  locale: Locale,
  totalMs: number,
  months: number,
  days: number,
  hours: number,
  minutes: number
): string {
  const l = LABELS[locale];
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  if (totalMs <= 0) return l.ended;

  if (totalDays > 30) {
    const mLabel = pluralize(months, l.month, l.months);
    const dLabel = pluralize(days, l.day, l.days);
    if (days > 0) {
      return `${l.approxPrefix}${months} ${mLabel} ${days} ${dLabel}`;
    }
    return `${l.approxPrefix}${months} ${mLabel}`;
  }

  if (totalDays >= 1) {
    const d = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    return `${d} ${pluralize(d, l.day, l.days)}`;
  }

  if (hours >= 1) {
    const hLabel = pluralize(hours, l.hour, l.hours);
    const mLabel = pluralize(minutes, l.minute, l.minutes);
    return `${hours} ${hLabel} ${minutes} ${mLabel}`;
  }

  const m = Math.max(1, minutes);
  return `${m} ${pluralize(m, l.minute, l.minutes)}`;
}

export function getPromoCountdown(
  endsAt: string | null | undefined,
  locale: Locale = "en",
  now: number = nowMs()
): PromoCountdownResult | null {
  if (!endsAt) return null;

  const endMs = parseEndsAtMs(endsAt);
  const totalMs = endMs - now;

  if (totalMs <= 0) {
    return {
      expired: true,
      totalMs: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: LABELS[locale].ended,
    };
  }

  const from = new Date(now);
  const to = new Date(endMs);
  const { months, days } = calendarDiffMYT(from, to);

  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  const label = formatCountdownLabel(locale, totalMs, months, days, hours, minutes);

  return {
    expired: false,
    totalMs,
    months,
    days,
    hours,
    minutes,
    seconds,
    label,
  };
}

/** End of selected calendar day in MYT → ISO UTC for storage. */
export function mytDateInputToISO(dateStr: string): string {
  // dateStr: YYYY-MM-DD — end of that day 23:59:59 MYT (UTC+8)
  return new Date(`${dateStr}T23:59:59+08:00`).toISOString();
}

function sortDepartureIsoDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

function sortDepartureEntries(entries: PromoDepartureEntry[]): PromoDepartureEntry[] {
  return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function isDepartureEntryObject(value: unknown): value is { name?: string; date?: string } {
  return typeof value === "object" && value !== null && "date" in value;
}

/** Normalize stored promo departures (supports legacy string[] and ends_at). */
export function normalizeDepartureEntries(promo: {
  title?: string;
  ends_at?: string | null;
  departure_dates?: unknown[] | null;
}): PromoDepartureEntry[] {
  const raw = promo.departure_dates;
  if (Array.isArray(raw) && raw.length > 0) {
    const entries: PromoDepartureEntry[] = [];
    for (const item of raw) {
      if (typeof item === "string" && item) {
        entries.push({ name: promo.title?.trim() || "", date: item });
        continue;
      }
      if (isDepartureEntryObject(item) && item.date) {
        entries.push({ name: String(item.name ?? "").trim(), date: item.date });
      }
    }
    return sortDepartureEntries(entries);
  }
  if (promo.ends_at) {
    return [{ name: promo.title?.trim() || "", date: promo.ends_at }];
  }
  return [];
}

/** ISO dates only (legacy helper). */
export function getPromoDepartureDates(promo: {
  title?: string;
  ends_at?: string | null;
  departure_dates?: unknown[] | null;
}): string[] {
  return normalizeDepartureEntries(promo).map((entry) => entry.date);
}

export function storedToDepartureRows(
  promo: { title?: string; ends_at?: string | null; departure_dates?: unknown[] | null }
): PromoDepartureRow[] {
  const entries = normalizeDepartureEntries(promo);
  if (entries.length === 0) return [{ name: "", date: "" }];
  return entries.map((entry) => ({
    name: entry.name,
    date: isoToMytDateInput(entry.date),
  }));
}

export function departureRowsToStored(rows: PromoDepartureRow[]): PromoDepartureEntry[] {
  const entries: PromoDepartureEntry[] = [];
  for (const row of rows) {
    const date = row.date.trim();
    if (!date) continue;
    entries.push({
      name: row.name.trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? mytDateInputToISO(date) : date,
    });
  }
  return sortDepartureEntries(entries);
}

/** Convert MYT date inputs (YYYY-MM-DD) to stored ISO values. */
export function mytDateInputsToISO(dates: string[]): string[] {
  const unique = new Set<string>();
  for (const date of dates) {
    const trimmed = date.trim();
    if (!trimmed) continue;
    unique.add(/^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? mytDateInputToISO(trimmed) : trimmed);
  }
  return sortDepartureIsoDates([...unique]);
}

/** Nearest upcoming departure; if all passed, returns the latest date. */
export function syncPromoEndsAt(departureDates: PromoDepartureEntry[] | string[]): string | null {
  const isoDates = Array.isArray(departureDates)
    ? departureDates.map((item) => (typeof item === "string" ? item : item.date)).filter(Boolean)
    : [];
  if (isoDates.length === 0) return null;
  const sorted = sortDepartureIsoDates(isoDates);
  const now = Date.now();
  const upcoming = sorted.filter((d) => new Date(d).getTime() - now > 0);
  if (upcoming.length > 0) return upcoming[0];
  return sorted[sorted.length - 1];
}

export function isPromoFullyExpired(
  promo: { title?: string; ends_at?: string | null; departure_dates?: unknown[] | null },
  now = Date.now()
): boolean {
  const dates = getPromoDepartureDates(promo);
  if (dates.length === 0) return false;
  return dates.every((d) => new Date(d).getTime() - now <= 0);
}

/** YYYY-MM in MYT for grouping departure dates by month. */
export function isoToMytMonthKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export function formatMonthKeyLabel(monthKey: string, locale: Locale): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(`${year}-${month}-01T12:00:00+08:00`);
  const loc = locale === "bm" ? "ms-MY" : "en-MY";
  return date.toLocaleDateString(loc, {
    timeZone: MYT_TIMEZONE,
    month: "long",
    year: "numeric",
  });
}

export function collectPromoMonthKeys(
  promos: { title?: string; ends_at?: string | null; departure_dates?: unknown[] | null }[]
): string[] {
  const months = new Set<string>();
  for (const promo of promos) {
    for (const date of getPromoDepartureDates(promo)) {
      months.add(isoToMytMonthKey(date));
    }
  }
  return [...months].sort((a, b) => b.localeCompare(a));
}

export function promoMatchesMonth(
  promo: { title?: string; ends_at?: string | null; departure_dates?: unknown[] | null },
  monthKey: string | null
): boolean {
  if (!monthKey) return true;
  return getPromoDepartureDates(promo).some((d) => isoToMytMonthKey(d) === monthKey);
}

/** Format ends_at for date input (YYYY-MM-DD in MYT). */
export function isoToMytDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

/** Format display date in MYT. */
export function formatPromoEndDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  const loc = locale === "bm" ? "ms-MY" : "en-MY";
  return new Date(iso).toLocaleDateString(loc, {
    timeZone: MYT_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Interval ms for live countdown refresh. */
export function countdownRefreshMs(totalMs: number): number {
  if (totalMs <= 0) return 60000;
  if (totalMs < 60 * 60 * 1000) return 1000;
  return 60000;
}

/** Sort promos by nearest upcoming departure date (closest first, expired last). */
export function sortPromosByNearestDeparture<T extends {
  title?: string;
  ends_at?: string | null;
  departure_dates?: unknown[] | null;
}>(promos: T[], now = Date.now()): T[] {
  return [...promos].sort((a, b) => {
    const datesA = getPromoDepartureDates(a).map((d) => new Date(d).getTime());
    const datesB = getPromoDepartureDates(b).map((d) => new Date(d).getTime());

    const upcomingA = datesA.filter((ms) => ms - now > 0).sort((x, y) => x - y);
    const upcomingB = datesB.filter((ms) => ms - now > 0).sort((x, y) => x - y);

    // Both have upcoming dates — sort by nearest
    if (upcomingA.length > 0 && upcomingB.length > 0) {
      return upcomingA[0] - upcomingB[0];
    }

    // Only one has upcoming — that one comes first
    if (upcomingA.length > 0) return -1;
    if (upcomingB.length > 0) return 1;

    // Both fully expired — sort by latest expired date (newest first)
    const latestA = datesA.length > 0 ? Math.max(...datesA) : 0;
    const latestB = datesB.length > 0 ? Math.max(...datesB) : 0;
    return latestB - latestA;
  });
}
