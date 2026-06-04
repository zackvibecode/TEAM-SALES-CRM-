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

const years = await fetch(
  `${url}/rest/v1/leads?select=created_at&limit=1000`,
  { headers }
).then((r) => r.json());

const counts = {};
for (const l of years) {
  const y = new Date(l.created_at).getFullYear();
  counts[y] = (counts[y] || 0) + 1;
}
console.log(JSON.stringify({ yearCounts: counts, sample: years.slice(0, 3) }, null, 2));
