function isAnonKey(key: string) {
  const k = key.trim();
  return (
    k.length > 20 &&
    (k.startsWith("eyJ") || k.startsWith("sb_publishable_"))
  );
}

function isServiceKey(key: string) {
  const k = key.trim();
  return (
    k.length > 20 &&
    (k.startsWith("eyJ") || k.startsWith("sb_secret_"))
  );
}

/** Safe hint for /api/health — never returns the key itself. */
export function describeKeyFormat(key: string): string {
  const k = key.trim();
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "legacy_jwt";
  if (k.startsWith("sb_publishable_")) return "publishable";
  if (k.startsWith("sb_secret_")) return "secret_in_wrong_slot";
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
  const serviceOk = isServiceKey(serviceKey);

  return { url, serviceKey, valid: publicValid && serviceOk, serviceOk };
}
