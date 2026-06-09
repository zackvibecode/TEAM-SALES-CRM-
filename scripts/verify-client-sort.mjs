import fs from "fs";

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const page = await fetch(
  `${url}/rest/v1/leads?select=id,created_at,list_order,name&limit=5&order=list_order.asc`,
  { headers }
).then((r) => r.json());

const missing = await fetch(
  `${url}/rest/v1/leads?select=list_order&list_order=is.null&limit=1`,
  { headers }
).then((r) => r.json());

console.log(
  JSON.stringify(
    {
      top5ByListOrder: page,
      nullListOrderCount: missing.length,
      hasListOrderField: page[0] && "list_order" in page[0],
    },
    null,
    2
  )
);
