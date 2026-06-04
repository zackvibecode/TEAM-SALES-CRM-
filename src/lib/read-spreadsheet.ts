import * as XLSX from "xlsx";
import { parseLeadRows } from "@/lib/parse-leads";
import { dateCreatedToISO } from "@/lib/lead-date-created";

export type SheetMatrix = (string | number | Date)[][];

function scoreSheetRows(rows: Record<string, unknown>[]): number {
  const parsed = parseLeadRows(rows);
  const withDate = parsed.filter(
    (r) => r.date_created && dateCreatedToISO(r.date_created)
  ).length;
  return parsed.length * 1000 + withDate * 10;
}

export function matrixToRows(matrix: SheetMatrix): Record<string, unknown>[] {
  if (!matrix.length) return [];

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const rowText = matrix[i].map((c) => String(c).toLowerCase()).join(" ");
    if (
      (/whatsapp|phone|mobile|telefon/.test(rowText) &&
        /name|nama|client|customer/.test(rowText)) ||
      /date\s*(created|added)|date_created|date_added|tarikh/i.test(rowText)
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = matrix[headerRowIndex] ?? [];
  let maxWidth = headerRow.length;
  for (let r = headerRowIndex + 1; r < Math.min(matrix.length, headerRowIndex + 30); r++) {
    maxWidth = Math.max(maxWidth, matrix[r]?.length ?? 0);
  }

  const headers = Array.from({ length: maxWidth }, (_, i) => {
    const label = String(headerRow[i] ?? "")
      .replace(/^\uFEFF/, "")
      .trim();
    return label || `Column_${i + 1}`;
  });

  const rows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line || line.every((c) => !String(c).trim())) continue;
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      record[h] = line[i] ?? "";
    });
    rows.push(record);
  }
  return rows;
}

/** Read Excel/CSV buffer; tries comma, semicolon, and tab delimiters for CSV. */
export function readSpreadsheetRows(buffer: ArrayBuffer): Record<string, unknown>[] {
  const delimiters: (string | undefined)[] = [undefined, ";", "\t"];
  let bestRows: Record<string, unknown>[] = [];
  let bestScore = 0;

  for (const fs of delimiters) {
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true,
      ...(fs ? { FS: fs } : {}),
    });

    for (const sheetName of workbook.SheetNames) {
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: "",
        raw: true,
      }) as SheetMatrix;
      const rows = matrixToRows(matrix);
      const score = scoreSheetRows(rows);
      if (score > bestScore) {
        bestScore = score;
        bestRows = rows;
      }
    }
  }

  return bestRows;
}
