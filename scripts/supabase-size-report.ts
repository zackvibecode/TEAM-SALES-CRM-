/**
 * Report Supabase DB size + SFU table counts (no secrets printed).
 * Usage: npx tsx scripts/supabase-size-report.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

async function countExact(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  table: string,
  filter?: { column: string; value: string }
) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter.column, filter.value);
  const { count, error } = await q;
  if (error) return { table, error: error.message, count: null as number | null };
  return { table, error: null, count: count ?? 0 };
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env in .env.local");
    process.exit(1);
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = [
    "sales_leads",
    "lead_follow_ups",
    "sales_pics",
    "sales_follow_up_events",
    "profiles",
    "leads",
  ];

  console.log("=== Row counts (exact) ===");
  for (const t of tables) {
    const r = await countExact(db, t);
    if (r.error) console.log(`${t}: ERROR ${r.error}`);
    else console.log(`${t}: ${r.count}`);
  }

  // Try DB size via rpc if exists; else raw SQL through REST isn't available without pg.
  // Use pg_catalog via a SQL function if project has one — fallback: estimate from counts.
  const sizeSql = `
    select
      pg_size_pretty(pg_database_size(current_database())) as db_size,
      pg_database_size(current_database()) as db_bytes
  `;

  // Supabase JS can't run arbitrary SQL without rpc. Try common helpers.
  const attempts = ["exec_sql", "sql", "run_sql"];
  let sizeDone = false;
  for (const fn of attempts) {
    const { data, error } = await db.rpc(fn, { query: sizeSql });
    if (!error) {
      console.log("=== DB size (rpc) ===");
      console.log(JSON.stringify(data, null, 2));
      sizeDone = true;
      break;
    }
  }

  if (!sizeDone) {
    // Table sizes via information_schema not exposed; try listing storage buckets size only.
    console.log("=== DB size ===");
    console.log(
      "No SQL RPC available from client. Check Supabase Dashboard → Project Settings → Usage,"
    );
    console.log("or SQL Editor:");
    console.log(
      "  select pg_size_pretty(pg_database_size(current_database())) as db_size;"
    );
    console.log(
      "  select relname, pg_size_pretty(pg_total_relation_size(relid)) from pg_catalog.pg_statio_user_tables order by pg_total_relation_size(relid) desc limit 20;"
    );
  }

  // SFU sample: leads with empty package
  const { count: emptyPkg } = await db
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .or("destination_or_product.is.null,destination_or_product.eq.");
  console.log("=== SFU quick ===");
  console.log(`sales_leads empty package (approx): ${emptyPkg ?? "n/a"}`);

  const { count: fu0 } = await db
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .eq("total_follow_ups", 0);
  console.log(`sales_leads with 0 follow-ups: ${fu0 ?? "n/a"}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
