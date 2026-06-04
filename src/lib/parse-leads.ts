import {
  dateCreatedToISO,
  extractDateCreatedFromRow,
  normalizeDateCreatedCell,
} from "@/lib/lead-date-created";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

export interface ParsedLeadRow {
  name: string;
  whatsapp: string;
  package_interest: string;
  notes: string;
  /** Raw "Date Created" cell from Excel — used to set leads.created_at on import */
  date_created?: string;
  /** Excel "No." column — stable row order for sorting */
  list_order?: number;
}

type RowRecord = Record<string, unknown>;

/** Strip UTF-8 BOM and whitespace from spreadsheet column headers (common in CSV exports). */
export function normalizeSpreadsheetHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim();
}

function normalizeLeadRowKeys(row: RowRecord): RowRecord {
  const out: RowRecord = {};
  for (const [key, value] of Object.entries(row)) {
    out[normalizeSpreadsheetHeader(key)] = value;
  }
  return out;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    // Avoid scientific notation for phone-sized numbers
    if (Math.abs(value) >= 1e9) return String(Math.round(value));
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value));
  }
  return String(value).trim();
}

/** Extract digits from text, wa.me links, or tel: URLs */
export function extractPhoneFromValue(value: unknown): string {
  const raw = cellToString(value);
  if (!raw) return "";

  const waMe = raw.match(/wa\.me\/(\d{8,15})/i);
  if (waMe) return formatWhatsAppNumber(waMe[1]);

  const tel = raw.match(/tel:([+\d\s\-()]+)/i);
  if (tel) return formatWhatsAppNumber(tel[1]);

  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length >= 8) {
    return formatWhatsAppNumber(digits);
  }

  return "";
}

function detectColumnExact(headers: string[], possibilities: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const p of possibilities) {
    const idx = lower.indexOf(p.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export function detectNameColumn(headers: string[]): string | null {
  const exact = detectColumnExact(headers, [
    "name", "client name", "customer name", "nama", "client_name", "full name", "customer",
  ]);
  if (exact) return exact;

  const lower = headers.map((h) => h.toLowerCase().trim());
  const idx = lower.findIndex(
    (h) =>
      /name|nama|customer|client|pelanggan/.test(h) &&
      !/file|owner|sales|user|email|package|whatsapp|phone|no\.?$/.test(h)
  );
  return idx >= 0 ? headers[idx] : null;
}

export function detectWhatsAppColumn(headers: string[]): string | null {
  const exact = detectColumnExact(headers, [
    "whatsapp number",
    "whatsapp",
    "whatsapp_number",
    "phone number",
    "phone",
    "mobile",
    "contact",
    "no telefon",
    "no tel",
    "no. telefon",
    "telefon",
    "tel",
    "hp",
    "contact number",
  ]);
  if (exact) return exact;

  const scored = headers
    .map((h) => {
      const l = h.toLowerCase().trim();
      if (/link|url|email|e-mail|chat/.test(l) && !/number|no\.?|phone|whatsapp/.test(l)) {
        return { h, score: 0 };
      }
      let score = 0;
      if (/whatsapp/.test(l)) score += l.includes("number") ? 10 : 6;
      if (/phone|mobile|telefon|tel|contact|hp/.test(l)) score += 5;
      if (/^no\.?$/.test(l)) score += 4;
      if (/number|nombor/.test(l)) score += 2;
      return { h, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.h ?? null;
}

export function detectPackageColumn(headers: string[]): string | null {
  return detectColumnExact(headers, [
    "package_interest", "package interest", "package", "pakej", "interest", "product",
  ]);
}

export function detectListOrderColumn(headers: string[]): string | null {
  return detectColumnExact(headers, [
    "no.",
    "no",
    "#",
    "bil",
    "row",
    "row no",
    "row no.",
    "nombor",
  ]);
}

function parseListOrder(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(String(value).trim());
  if (!Number.isFinite(n) || n < 1 || n > 5_000_000) return undefined;
  return Math.floor(n);
}

export function detectNotesColumn(headers: string[]): string | null {
  return detectColumnExact(headers, [
    "notes", "note", "remarks", "catatan", "komen", "remark",
  ]);
}

export function detectDateCreatedColumn(headers: string[]): string | null {
  const normalized = headers.map((h) => normalizeSpreadsheetHeader(h));
  const exact = detectColumnExact(normalized, [
    "date added",
    "date_added",
    "dateadded",
    "added date",
    "added on",
    "date created",
    "date_created",
    "datecreated",
    "created date",
    "creation date",
    "record date",
    "created on",
    "created at",
    "client created",
    "date create",
    "tarikh dicipta",
    "tarikh ditambah",
    "tarikh create",
    "tarikh created",
    "tarikh",
    "date",
    "date create",
    "registration date",
    "register date",
    "time added",
  ]);
  if (exact) return exact;

  const lower = normalized.map((h) => h.toLowerCase().trim());
  const addedIdx = lower.findIndex((h) => /date/.test(h) && /added/.test(h));
  if (addedIdx >= 0) return normalized[addedIdx];

  const idx = lower.findIndex(
    (h) =>
      (/date/.test(h) && /created|create|dicipta|creation|record/.test(h)) ||
      h === "date created" ||
      h === "date" ||
      h === "tarikh"
  );
  return idx >= 0 ? normalized[idx] : null;
}

/** When header has no "Date Created", pick column whose cells parse as dates (e.g. unlabeled Excel cols). */
export function detectDateColumnByContent(
  headers: string[],
  rows: RowRecord[],
  skipCols: Set<string>
): string | null {
  const sample = rows.slice(0, Math.min(rows.length, 200));
  let bestCol: string | null = null;
  let bestHits = 0;

  for (const h of headers) {
    if (skipCols.has(h)) continue;
    const label = h.toLowerCase().trim();
    if (/^(no\.?|#|bil|email|e-?mail|whatsapp|phone|mobile|link|url|chat)$/i.test(label)) {
      continue;
    }
    if (/^column_\d+$/i.test(label)) {
      /* allow generic columns — often hold dates without headers */
    }

    let hits = 0;
    let checked = 0;
    for (const row of sample) {
      const raw = row[h];
      if (raw === null || raw === undefined || raw === "") continue;
      checked++;
      const normalized = normalizeDateCreatedCell(raw);
      if (normalized && dateCreatedToISO(normalized)) hits++;
    }
    if (checked >= 5 && hits >= 3 && hits > bestHits && hits / checked >= 0.35) {
      bestHits = hits;
      bestCol = h;
    }
  }
  return bestCol;
}

function findPhoneInRow(row: RowRecord, headers: string[], skipKeys: Set<string>): string {
  for (const key of headers) {
    if (skipKeys.has(key)) continue;
    const phone = extractPhoneFromValue(row[key]);
    if (phone.length >= 10) return phone;
  }
  return "";
}

function isBlankRow(row: RowRecord): boolean {
  return Object.values(row).every((v) => !cellToString(v));
}

export function parseLeadRows(json: RowRecord[]): ParsedLeadRow[] {
  if (json.length === 0) return [];

  const rows = json.map(normalizeLeadRowKeys);
  const headers = Object.keys(rows[0]);
  const nameCol = detectNameColumn(headers);
  const waCol = detectWhatsAppColumn(headers);
  const pkgCol = detectPackageColumn(headers);
  const notesCol = detectNotesColumn(headers);
  const noCol = detectListOrderColumn(headers);
  const linkCol = headers.find((h) => /whatsapp\s*link/i.test(h));
  const skipForScan = new Set(
    [nameCol, waCol, linkCol, pkgCol, notesCol].filter(Boolean) as string[]
  );
  const dateCol =
    detectDateCreatedColumn(headers) ??
    detectDateColumnByContent(headers, rows, skipForScan);

  const parsed: ParsedLeadRow[] = [];

  for (const row of rows) {
    if (isBlankRow(row)) continue;

    let name = nameCol ? cellToString(row[nameCol]) : "";
    if (!name && !nameCol) {
      const firstKey = headers[0];
      if (firstKey && !/^(no\.?|#|bil)$/i.test(firstKey)) {
        name = cellToString(row[firstKey]);
      }
    }

    let whatsapp = waCol ? extractPhoneFromValue(row[waCol]) : "";
    if (!whatsapp && linkCol) {
      whatsapp = extractPhoneFromValue(row[linkCol]);
    }
    if (!whatsapp) {
      whatsapp = findPhoneInRow(row, headers, skipForScan);
    }

    let package_interest = pkgCol ? cellToString(row[pkgCol]) : "";
    const notes = notesCol ? cellToString(row[notesCol]) : "";
    const skipDateScan = new Set([
      ...skipForScan,
      ...(noCol ? [noCol] : []),
    ]);
    let date_created = extractDateCreatedFromRow(row, headers, dateCol, skipDateScan);

    if (!date_created && package_interest) {
      const fromPkg = normalizeDateCreatedCell(package_interest);
      if (fromPkg && dateCreatedToISO(fromPkg)) {
        date_created = fromPkg;
        package_interest = "";
      }
    }

    // Skip header-like rows accidentally parsed as data
    if (/^(client name|customer name|nama|name|whatsapp)/i.test(name) && !whatsapp) {
      continue;
    }

    // Skip rows with no usable phone
    if (!whatsapp || whatsapp.length < 9) continue;

    const list_order = noCol ? parseListOrder(row[noCol]) : undefined;

    parsed.push({
      name: name || "Unknown",
      whatsapp,
      package_interest,
      notes,
      ...(date_created ? { date_created } : {}),
      ...(list_order != null ? { list_order } : {}),
    });
  }

  return parsed;
}
