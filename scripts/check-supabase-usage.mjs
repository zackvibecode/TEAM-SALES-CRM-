import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const TABLES = [
  "profiles",
  "uploaded_files",
  "leads",
  "lead_activities",
  "follow_ups",
  "activity_logs",
  "audit_logs",
];

const FREE_LIMITS = {
  databaseMb: 500,
  storageGb: 1,
  bandwidthGb: 5,
  mau: 50000,
  edgeFunctions: 500000,
};

async function countTable(db, table) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) return { table, error: error.message, count: null };
  return { table, count: count ?? 0 };
}

async function listStorage(db) {
  const { data: buckets, error } = await db.storage.listBuckets();
  if (error) return { error: error.message, buckets: [], totalObjects: 0, totalBytes: 0 };

  let totalObjects = 0;
  let totalBytes = 0;
  const bucketDetails = [];

  for (const bucket of buckets ?? []) {
    const { data: objects, error: listErr } = await db.storage.from(bucket.name).list("", { limit: 1000 });
    if (listErr) {
      bucketDetails.push({ name: bucket.name, error: listErr.message });
      continue;
    }
    const items = objects ?? [];
    const bytes = items.reduce((sum, o) => sum + (o.metadata?.size ?? 0), 0);
    totalObjects += items.length;
    totalBytes += bytes;
    bucketDetails.push({ name: bucket.name, objects: items.length, bytes });
  }

  return { buckets: bucketDetails, totalObjects, totalBytes };
}

async function countAuthUsers(url, serviceKey) {
  try {
    const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!res.ok) return { error: `HTTP ${res.status}`, total: null };
    const data = await res.json();
    return { total: data?.total ?? data?.users?.length ?? null };
  } catch (e) {
    return { error: e.message, total: null };
  }
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const projectRef = url.match(/https:\/\/([^.]+)/)?.[1] ?? "unknown";

console.log("=== Supabase Usage Report ===");
console.log(`Project: ${projectRef}`);
console.log(`URL: ${url}`);
console.log("");

const counts = await Promise.all(TABLES.map((t) => countTable(db, t)));
let totalRows = 0;
console.log("--- Database rows (your CRM data) ---");
for (const row of counts) {
  if (row.error) console.log(`  ${row.table}: ERROR - ${row.error}`);
  else {
    console.log(`  ${row.table}: ${row.count.toLocaleString()} rows`);
    totalRows += row.count;
  }
}
console.log(`  TOTAL rows: ${totalRows.toLocaleString()}`);

const storage = await listStorage(db);
console.log("\n--- File storage (Supabase Storage buckets) ---");
if (storage.error) console.log(`  ERROR: ${storage.error}`);
else if (storage.buckets.length === 0) console.log("  No storage buckets (0 bytes used)");
else {
  for (const b of storage.buckets) {
    if (b.error) console.log(`  ${b.name}: ERROR - ${b.error}`);
    else console.log(`  ${b.name}: ${b.objects} files, ${fmtBytes(b.bytes)}`);
  }
  console.log(`  TOTAL storage: ${storage.totalObjects} files, ${fmtBytes(storage.totalBytes)}`);
}

const authUsers = await countAuthUsers(url, serviceKey);
console.log("\n--- Auth users ---");
if (authUsers.error) console.log(`  Could not fetch: ${authUsers.error}`);
else console.log(`  Registered users: ${authUsers.total ?? "unknown"}`);

console.log("\n--- Free plan limits (Supabase default) ---");
console.log(`  Database space: ${FREE_LIMITS.databaseMb} MB included`);
console.log(`  File storage: ${FREE_LIMITS.storageGb} GB included`);
console.log(`  Bandwidth: ${FREE_LIMITS.bandwidthGb} GB/month included`);
console.log(`  Monthly active users: ${FREE_LIMITS.mau.toLocaleString()} included`);

console.log("\n--- Notes ---");
console.log("  Exact DB size (MB) & monthly API/bandwidth usage are only in Supabase Dashboard:");
console.log(`  https://supabase.com/dashboard/project/${projectRef}/settings/billing`);
console.log(`  https://supabase.com/dashboard/project/${projectRef}/reports/database`);
