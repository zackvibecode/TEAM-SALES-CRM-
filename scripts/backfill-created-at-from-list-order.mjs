/**
 * Fallback: spread created_at across June 2024 by Excel list_order
 * when import had no parseable Date Created column.
 */
import fs from "fs";

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

function isoFromListOrder(listOrder) {
  const ms = Date.UTC(2024, 5, 4, 0, listOrder - 1, 0);
  return new Date(ms).toISOString();
}

let updated = 0;
let skipped = 0;
let failed = 0;
const pageSize = 200;
let from = 0;

while (true) {
  const rows = await fetch(
    `${url}/rest/v1/leads?select=id,list_order,created_at&list_order=not.is.null&order=list_order.asc&offset=${from}&limit=${pageSize}`,
    { headers }
  ).then((r) => r.json());

  if (!rows?.length) break;

  for (const row of rows) {
    const year = new Date(row.created_at).getFullYear();
    if (year !== 2026) {
      skipped++;
      continue;
    }
    const iso = isoFromListOrder(row.list_order);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const patch = await fetch(`${url}/rest/v1/leads?id=eq.${row.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            created_at: iso,
            updated_at: new Date().toISOString(),
          }),
        });
        if (patch.ok) {
          updated++;
          break;
        }
        if (attempt === 2) failed++;
      } catch {
        if (attempt === 2) failed++;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  if (rows.length < pageSize) break;
  from += pageSize;
}

console.log(JSON.stringify({ updated, skipped, failed }, null, 2));
