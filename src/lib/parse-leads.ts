import { normalizeDateCreatedCell } from "@/lib/lead-date-created";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

export interface ParsedLeadRow {
  name: string;
  whatsapp: string;
  package_interest: string;
  notes: string;
  /** Raw "Date Created" cell from Excel — used to set leads.created_at on import */
  date_created?: string;
}

type RowRecord = Record<string, unknown>;

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

export function detectNotesColumn(headers: string[]): string | null {
  return detectColumnExact(headers, [
    "notes", "note", "remarks", "catatan", "komen", "remark",
  ]);
}

export function detectDateCreatedColumn(headers: string[]): string | null {
  const exact = detectColumnExact(headers, [
    "date created",
    "date_created",
    "created date",
    "tarikh dicipta",
    "tarikh",
  ]);
  if (exact) return exact;

  const lower = headers.map((h) => h.toLowerCase().trim());
  const idx = lower.findIndex(
    (h) =>
      (/date/.test(h) && /created|create|dicipta/.test(h)) ||
      h === "date created"
  );
  return idx >= 0 ? headers[idx] : null;
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

  const headers = Object.keys(json[0]);
  const nameCol = detectNameColumn(headers);
  const waCol = detectWhatsAppColumn(headers);
  const pkgCol = detectPackageColumn(headers);
  const notesCol = detectNotesColumn(headers);
  const dateCol = detectDateCreatedColumn(headers);
  const linkCol = headers.find((h) => /whatsapp\s*link/i.test(h));

  const skipForScan = new Set(
    [nameCol, pkgCol, notesCol, dateCol].filter(Boolean) as string[]
  );

  const parsed: ParsedLeadRow[] = [];

  for (const row of json) {
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

    const package_interest = pkgCol ? cellToString(row[pkgCol]) : "";
    const notes = notesCol ? cellToString(row[notesCol]) : "";
    const date_created = dateCol
      ? normalizeDateCreatedCell(row[dateCol])
      : "";

    // Skip header-like rows accidentally parsed as data
    if (/^(client name|customer name|nama|name|whatsapp)/i.test(name) && !whatsapp) {
      continue;
    }

    // Skip rows with no usable phone
    if (!whatsapp || whatsapp.length < 9) continue;

    parsed.push({
      name: name || "Unknown",
      whatsapp,
      package_interest,
      notes,
      ...(date_created ? { date_created } : {}),
    });
  }

  return parsed;
}
