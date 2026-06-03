/**
 * E2E test: create user (service role) + login via Vercel production (2 runs).
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

async function testRound(run) {
  const email = `test-run-${run}-${Date.now()}@nusatravel.com`;
  const password = "Test99!Pass";
  const full_name = `Test Run ${run}`;

  // Step 1: Create user via service role
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createErr) {
    console.error(`Run ${run}: CREATE FAIL -`, createErr.message);
    return false;
  }

  const { error: profErr } = await admin
    .from("profiles")
    .upsert({ id: createData.user.id, email, full_name, role: "sales" }, { onConflict: "id" });
  if (profErr) {
    console.error(`Run ${run}: PROFILE FAIL -`, profErr.message);
    return false;
  }

  // Step 2: Login as new sales user via Vercel production
  const vRes = await fetch("https://team-sales-crm.vercel.app/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const vData = await vRes.json();
  if (!vData.success || vData.role !== "sales") {
    console.error(`Run ${run}: VERCEL LOGIN FAIL - status=${vRes.status},`, vData.error || JSON.stringify(vData));
    return false;
  }

  // Step 3: Verify role in profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", createData.user.id)
    .single();
  if (profile?.role !== "sales") {
    console.error(`Run ${run}: ROLE CHECK FAIL - expected sales, got`, profile?.role);
    return false;
  }

  // Cleanup
  await admin.auth.admin.deleteUser(createData.user.id);
  return true;
}

const env = loadEnv();
console.log("E2E test: create + login via Vercel (2 runs)...\n");

const r1 = await testRound(1);
console.log(`Round 1: ${r1 ? "PASSED" : "FAILED"}`);

const r2 = await testRound(2);
console.log(`Round 2: ${r2 ? "PASSED" : "FAILED"}`);

if (!r1 || !r2) {
  console.error("\nFAILED: Some rounds did not pass.");
  process.exit(1);
}

console.log("\nALL E2E TESTS PASSED (2/2)");
