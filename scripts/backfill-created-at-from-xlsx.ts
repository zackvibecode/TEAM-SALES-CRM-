/**
 * Backfill leads.created_at from Excel "Date Created" (or auto-detected date column).
 * Usage: npx tsx scripts/backfill-created-at-from-xlsx.ts "path/to/file.xlsx"
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  batchUpdateLeadDatesForOwner,
  buildLeadDatePatches,
} from "../src/lib/batch-update-lead-dates";
import { dateCreatedToISO } from "../src/lib/lead-date-created";
import { detectDateCreatedColumn, parseLeadRows } from "../src/lib/parse-leads";
import { readSpreadsheetRows } from "../src/lib/read-spreadsheet";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) throw new Error("Missing .env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx scripts/backfill-created-at-from-xlsx.ts "file.xlsx"');
    process.exit(1);
  }

  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key);

  const buf = fs.readFileSync(path.resolve(filePath));
  const rawRows = readSpreadsheetRows(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const parsed = parseLeadRows(rawRows);
  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  console.log("Columns:", headers.join(", "));
  console.log("Date column:", detectDateCreatedColumn(headers) ?? "none");
  const withDate = parsed.filter(
    (r) => r.date_created && dateCreatedToISO(r.date_created)
  );

  console.log(`Parsed ${parsed.length} leads, ${withDate.length} with parseable dates`);
  if (withDate.length === 0) {
    console.error(
      'No dates found. Add a "Date Created" column to Excel (or a column of dates we can detect).'
    );
    console.error("Columns:", rawRows[0] ? Object.keys(rawRows[0]) : []);
    process.exit(1);
  }

  const { data: ownerRow } = await db
    .from("leads")
    .select("owner_user_id")
    .limit(1)
    .single();

  const ownerUserId = ownerRow?.owner_user_id;
  if (!ownerUserId) {
    console.error("No leads in database to infer owner_user_id. Pass owner via API upload instead.");
    process.exit(1);
  }

  const patches = buildLeadDatePatches(withDate);
  const { updated, failed } = await batchUpdateLeadDatesForOwner(
    db,
    ownerUserId,
    patches
  );

  console.log(
    JSON.stringify({
      updated,
      failed,
      ownerUserId,
      totalWithDate: withDate.length,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
