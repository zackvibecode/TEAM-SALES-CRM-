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

  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? 0 : parsed;
}
/** Convert Excel Date Created string to ISO for leads.created_at */
export function dateCreatedToISO(value: string | null | undefined): string | null {
  const ms = parseDateCreated(value);
  if (!ms) return null;
  return new Date(ms).toISOString();
}

export function sortLeadsByDateCreatedOldestFirst<T extends { created_at: string }>(
  leads: T[]
): T[] {
  return [...leads].sort(
    (a, b) => parseDateCreated(a.created_at) - parseDateCreated(b.created_at)
  );
}
