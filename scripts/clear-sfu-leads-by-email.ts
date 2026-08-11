/**
 * One-off: clear Sales Follow-Up leads for a PIC/user by email.
 * Usage: npx tsx scripts/clear-sfu-leads-by-email.ts raretripbynusa@gmail.com
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

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: npx tsx scripts/clear-sfu-leads-by-email.ts <email>");
    process.exit(1);
  }

  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) PIC by email
  const { data: picsByEmail, error: picEmailErr } = await db
    .from("sales_pics")
    .select("id, name, email, user_id, status")
    .ilike("email", email);

  if (picEmailErr) throw new Error(picEmailErr.message);

  // 2) Profile by email → PIC by user_id
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email);

  const profileIds = (profiles ?? []).map((p) => p.id);
  let picsByUser: Array<{
    id: string;
    name: string;
    email: string | null;
    user_id: string | null;
    status: string | null;
  }> = [];

  if (profileIds.length > 0) {
    const { data, error } = await db
      .from("sales_pics")
      .select("id, name, email, user_id, status")
      .in("user_id", profileIds);
    if (error) throw new Error(error.message);
    picsByUser = data ?? [];
  }

  const picMap = new Map<string, (typeof picsByUser)[0]>();
  for (const p of [...(picsByEmail ?? []), ...picsByUser]) {
    picMap.set(p.id, p);
  }
  const pics = Array.from(picMap.values());

  if (pics.length === 0) {
    console.log(`No sales_pics found for ${email}`);
    process.exit(0);
  }

  console.log(
    `Found ${pics.length} PIC(s):`,
    pics.map((p) => `${p.name} (${p.id}) status=${p.status}`).join(", ")
  );

  const picIds = pics.map((p) => p.id);

  let totalFuDeleted = 0;
  let totalLeadsDeleted = 0;
  const pageSize = 1000;

  // Paginate — PostgREST defaults to max 1000 rows per select
  for (;;) {
    const { data: leads, error: leadErr } = await db
      .from("sales_leads")
      .select("id")
      .in("assigned_pic_id", picIds)
      .limit(pageSize);

    if (leadErr) throw new Error(leadErr.message);
    const leadIds = (leads ?? []).map((l) => l.id);
    if (leadIds.length === 0) break;

    console.log(`Batch: deleting ${leadIds.length} leads...`);

    const chunkSize = 200;
    for (let i = 0; i < leadIds.length; i += chunkSize) {
      const chunk = leadIds.slice(i, i + chunkSize);

      const { data: fuRows, error: fuErr } = await db
        .from("lead_follow_ups")
        .delete()
        .in("lead_id", chunk)
        .select("id");
      if (fuErr) throw new Error(`follow_ups: ${fuErr.message}`);
      totalFuDeleted += fuRows?.length ?? 0;

      const { data: leadRows, error: delErr } = await db
        .from("sales_leads")
        .delete()
        .in("id", chunk)
        .select("id");
      if (delErr) throw new Error(`leads: ${delErr.message}`);
      totalLeadsDeleted += leadRows?.length ?? 0;
    }

    if (leadIds.length < pageSize) break;
  }

  console.log(`Deleted follow-ups: ${totalFuDeleted}`);
  console.log(`Deleted leads: ${totalLeadsDeleted}`);

  const { count: remaining, error: remErr } = await db
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .in("assigned_pic_id", picIds);
  if (remErr) throw new Error(remErr.message);
  console.log(`Remaining leads for PIC(s): ${remaining ?? 0}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
