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
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const sample = await fetch(
  `${url}/rest/v1/leads?select=list_order,created_at,name&list_order=not.is.null&order=list_order.asc&limit=3`,
  { headers }
).then((r) => r.json());

const res = await fetch(`${url}/rest/v1/leads?select=id&list_order=not.is.null`, {
  headers: { ...headers, Prefer: "count=exact" },
  method: "HEAD",
});
const range = res.headers.get("content-range");

console.log(JSON.stringify({ sample, withListOrder: range }, null, 2));
