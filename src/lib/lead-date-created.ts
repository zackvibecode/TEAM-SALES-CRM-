/** Excel 1900 date serial → milliseconds (date-only or date+time fraction). */
function excelSerialToMs(serial: number): number {
  const wholeDays = Math.floor(serial);
  const dayFraction = serial - wholeDays;
  const utcMs =
    Date.UTC(1899, 11, 30) + wholeDays * 86_400_000 + Math.round(dayFraction * 86_400_000);
  return utcMs;
}

/**
 * Normalize a Date Created cell from Excel/CSV (string, serial number, or ISO).
 * Returns a string suitable for parseDateCreated / dateCreatedToISO.
 */
export function normalizeDateCreatedCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 20_000 && value < 120_000) {
      return new Date(excelSerialToMs(value)).toISOString();
    }
    return "";
  }
  return String(value).trim();
}

/**
 * Parse "Date Created" from Excel (e.g. "2026-06-01 - 01:25") or ISO timestamps.
 * Returns milliseconds since epoch; invalid/missing → 0 (sorted first among unknowns).
 */
export function parseDateCreated(value: string | null | undefined): number {
  if (value == null) return 0;
  const s = String(value).trim();
  if (!s) return 0;

  const serial = Number(s);
  if (!Number.isNaN(serial) && serial > 20_000 && serial < 120_000 && !/\D/.test(s)) {
    const t = excelSerialToMs(serial);
    return Number.isNaN(t) ? 0 : t;
  }

  const dmy4 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmy4) {
    const day = Number(dmy4[1]);
    const month = Number(dmy4[2]) - 1;
    const year = Number(dmy4[3]);
    const hour = dmy4[4] ? Number(dmy4[4]) : 0;
    const minute = dmy4[5] ? Number(dmy4[5]) : 0;
    const second = dmy4[6] ? Number(dmy4[6]) : 0;
    const d = new Date(year, month, day, hour, minute, second);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  // MY Excel often exports 24/06/24 (DD/MM/YY)
  const dmy2 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})(?:\s|$)/);
  if (dmy2) {
    const day = Number(dmy2[1]);
    const month = Number(dmy2[2]) - 1;
    let year = Number(dmy2[3]);
    year += year >= 70 ? 1900 : 2000;
    const d = new Date(year, month, day);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  const monthName = s.match(
    /^(\d{1,2})[\s\/\-.]([A-Za-z]{3,9})[\s\/\-.](\d{2,4})/
  );
  if (monthName) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? 0 : t;
  }

  const excelMatch = s.match(
    /^(\d{4})-(\d{2})-(\d{2})\s*-\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (excelMatch) {
    const year = Number(excelMatch[1]);
    const month = Number(excelMatch[2]) - 1;
    const day = Number(excelMatch[3]);
    const hour = Number(excelMatch[4]);
    const minute = Number(excelMatch[5]);
    const second = excelMatch[6] ? Number(excelMatch[6]) : 0;
    const d = new Date(year, month, day, hour, minute, second);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  const isoDate = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? 0 : t;
  }

  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Pick the best date-like value from a row (any column). Prefers DMY for ambiguous numeric dates. */
export function extractDateCreatedFromRow(
  row: Record<string, unknown>,
  headers: string[],
  primaryCol: string | null,
  skipCols: Set<string>
): string {
  if (primaryCol) {
    const primary = normalizeDateCreatedCell(row[primaryCol]);
    if (primary && dateCreatedToISO(primary)) return primary;
  }
  const priority = headers.filter((h) =>
    /date\s*(added|created)|added\s*date|created\s*(at|on)|tarikh/i.test(h)
  );
  const ordered = [...priority, ...headers.filter((h) => !priority.includes(h))];

  for (const h of ordered) {
    if (skipCols.has(h)) continue;
    if (
      /^(no\.?|#|bil|name|client|customer|nama|whatsapp|phone|mobile|link|url|email)/i.test(h)
    ) {
      continue;
    }
    if (/assign|follow\s*up|last\s*activ|updated|modified|contacted\s*status/i.test(h)) {
      continue;
    }
    const normalized = normalizeDateCreatedCell(row[h]);
    if (normalized && dateCreatedToISO(normalized)) return normalized;
  }
  return "";
}
/** Convert Excel Date Created string to ISO for leads.created_at */
export function dateCreatedToISO(value: string | null | undefined): string | null {
  const ms = parseDateCreated(value);
  if (!ms) return null;
  return new Date(ms).toISOString();
}

export type DateCreatedSortDirection = "asc" | "desc";

export function formatLeadDateCreated(createdAt: string | null | undefined): string {
  const ms = parseDateCreated(createdAt);
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sortLeadsByDateCreated<
  T extends { created_at: string; list_order?: number | null },
>(leads: T[], direction: DateCreatedSortDirection = "asc"): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...leads].sort((a, b) => {
    const da = parseDateCreated(a.created_at);
    const db = parseDateCreated(b.created_at);
    if (da !== db) return sign * (da - db);
    const la = a.list_order ?? Number.MAX_SAFE_INTEGER;
    const lb = b.list_order ?? Number.MAX_SAFE_INTEGER;
    return sign * (la - lb);
  });
}

export function sortLeadsByDateCreatedOldestFirst<T extends { created_at: string }>(
  leads: T[]
): T[] {
  return sortLeadsByDateCreated(leads, "asc");
}

/** Inclusive range for YYYY-MM-DD date inputs (local calendar days). */
export function leadCreatedAtInRange(
  createdAt: string,
  dateFrom: string,
  dateTo: string
): boolean {
  const ms = parseDateCreated(createdAt);
  if (!ms) return false;
  const start = new Date(dateFrom);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateTo);
  end.setHours(23, 59, 59, 999);
  return ms >= start.getTime() && ms <= end.getTime();
}
