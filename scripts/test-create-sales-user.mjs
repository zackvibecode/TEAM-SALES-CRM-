/**
 * Verifies service role can create a sales user and that user can log in.
 * Usage: node scripts/test-create-sales-user.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).trim();
  }
  return env;
}

async function runOnce(admin, anon, url, run) {
  const email = `test-sales-${run}-${Date.now()}@nusatravel.com`;
  const password = "TestPass99!";
  const full_name = `Test Sales ${run}`;

  const { error: probeError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (probeError) throw new Error(`Probe failed: ${probeError.message}`);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) throw new Error(`Create failed: ${error.message}`);

  const { error: profileError } = await admin.from("profiles").upsert(
    { id: data.user.id, email, full_name, role: "sales" },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(`Profile failed: ${profileError.message}`);

  const loginClient = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError) throw new Error(`Login failed: ${loginError.message}`);
  if (!loginData.user) throw new Error("Login returned no user");

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profile?.role !== "sales") throw new Error(`Expected role sales, got ${profile?.role}`);

  await admin.auth.admin.deleteUser(data.user.id);
  console.log(`OK run ${run}: create + login + role=sales for ${email}`);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error("Missing env in .env.local");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("Testing create + login (2 runs)...");
await runOnce(admin, anon, url, 1);
await runOnce(admin, anon, url, 2);
console.log("All tests passed.");
