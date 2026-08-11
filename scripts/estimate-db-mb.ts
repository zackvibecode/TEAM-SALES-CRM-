import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
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

function avgJsonBytes(rows: unknown[] | null): number {
  if (!rows?.length) return 0;
  let sum = 0;
  for (const r of rows) sum += Buffer.byteLength(JSON.stringify(r), "utf8");
  return sum / rows.length;
}

async function main() {
  const env = loadEnvLocal();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = [
    "leads",
    "sales_leads",
    "lead_follow_ups",
    "sales_pics",
    "profiles",
    "sales_follow_up_events",
  ];

  let totalEst = 0;
  console.log("table | rows | avg_json_bytes | est_MB");
  for (const t of tables) {
    const { count, error: cErr } = await db.from(t).select("*", { count: "exact", head: true });
    if (cErr) {
      console.log(`${t} | ERROR ${cErr.message}`);
      continue;
    }
    const { data } = await db.from(t).select("*").limit(50);
    const avg = avgJsonBytes(data);
    // JSON is larger than on-disk row; factor ~1.8 covers row + indexes roughly
    const estMb = ((count ?? 0) * avg * 1.8) / (1024 * 1024);
    totalEst += estMb;
    console.log(`${t} | ${count ?? 0} | ${Math.round(avg)} | ${estMb.toFixed(2)}`);
  }
  console.log(`ESTIMATED_TOTAL_MB=${totalEst.toFixed(1)}`);
  console.log(`FREE_LIMIT_MB=500`);
  console.log(`HEADROOM_PCT=${(((500 - totalEst) / 500) * 100).toFixed(0)}% left (approx)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
