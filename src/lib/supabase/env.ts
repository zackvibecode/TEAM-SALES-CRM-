function decodeJwtRole(key: string): string | null {
  const parts = key.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isAnonKey(key: string) {
  const k = key.trim();
  if (k.startsWith("sb_publishable_")) return k.length > 20;
  if (!k.startsWith("eyJ") || k.length <= 20) return false;
  const role = decodeJwtRole(k);
  return role === "anon" || role === null;
}

function isServiceKey(key: string) {
  const k = key.trim();
  if (k.startsWith("sb_secret_")) return k.length > 20;
  if (!k.startsWith("eyJ") || k.length <= 20) return false;
  return decodeJwtRole(k) === "service_role";
}

/** Safe hint for /api/health — never returns the key itself. */
export function describeKeyFormat(key: string): string {
  const k = key.trim();
  if (!k) return "missing";
  if (k.startsWith("eyJ")) {
    const role = decodeJwtRole(k);
    if (role === "service_role") return "legacy_jwt_service";
    if (role === "anon") return "legacy_jwt_anon";
    return "legacy_jwt";
  }
  if (k.startsWith("sb_publishable_")) return "publishable";
  if (k.startsWith("sb_secret_")) return "secret";
  if (k.startsWith("sb_")) return "unknown_sb_prefix";
  if (k.includes("supabase.com/dashboard")) return "dashboard_url_not_key";
  return "unrecognized";
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const urlOk = url.startsWith("https://") && url.includes("supabase");
  const anonOk = isAnonKey(anonKey);
  const valid = urlOk && anonOk;

  return { url, anonKey, valid, urlOk, anonOk };
}

export function getSupabaseServiceEnv() {
  const { url, valid: publicValid } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const serviceKeyRole = serviceKey.startsWith("eyJ") ? decodeJwtRole(serviceKey) : null;
  const serviceOk = isServiceKey(serviceKey);
  const anonInServiceSlot = serviceKeyRole === "anon";

  return {
    url,
    serviceKey,
    serviceKeyRole,
    anonInServiceSlot,
    valid: publicValid && serviceOk,
    serviceOk,
  };
}

export const SERVICE_KEY_SETUP_HINT =
  "SUPABASE_SERVICE_ROLE_KEY salah. Di Vercel, paste key service_role (bukan anon) dari Supabase → Settings → API, kemudian Redeploy.";
