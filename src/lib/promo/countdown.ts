import type { Locale } from "@/lib/i18n/locale";
import type { PromoCountdownResult } from "@/types/promo";

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
