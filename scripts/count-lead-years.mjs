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
const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" };

const y2024 = await fetch(
  `${url}/rest/v1/leads?select=id&created_at=gte.2024-01-01&created_at=lt.2025-01-01`,
  { headers, method: "HEAD" }
);
const y2026 = await fetch(`${url}/rest/v1/leads?select=id&created_at=gte.2026-01-01`, {
  headers,
  method: "HEAD",
});
const total = await fetch(`${url}/rest/v1/leads?select=id`, { headers, method: "HEAD" });

console.log(
  JSON.stringify(
    {
      total: total.headers.get("content-range"),
      in2024: y2024.headers.get("content-range"),
      still2026: y2026.headers.get("content-range"),
    },
    null,
    2
  )
);
