import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) throw new Error("Missing .env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sql = fs.readFileSync(
  path.join(process.cwd(), "supabase-migrations", "008_lead_list_order.sql"),
  "utf8"
);

const res = await fetch(`${url}/rest/v1/rpc`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
}).catch(() => null);

console.log(
  "If list_order column missing, run this SQL in Supabase SQL Editor:\n\n" + sql
);

const probe = await fetch(
  `${url}/rest/v1/leads?select=list_order&limit=1`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
const body = await probe.json();
if (probe.ok && !body.message?.includes("list_order")) {
  console.log("OK: list_order column exists");
} else {
  console.log("NEEDS_MIGRATION:", JSON.stringify(body));
  process.exit(1);
}
