export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const urlOk = url.startsWith("https://") && url.includes("supabase");
  const anonOk =
    anonKey.length > 20 &&
    anonKey.startsWith("eyJ") &&
    !anonKey.startsWith("sb_publishable");

  const valid = urlOk && anonOk;

  return { url, anonKey, valid, urlOk, anonOk };
}

export function getSupabaseServiceEnv() {
  const { url, valid: publicValid } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const serviceOk =
    serviceKey.length > 20 &&
    serviceKey.startsWith("eyJ") &&
    !serviceKey.startsWith("sb_secret");

  return { url, serviceKey, valid: publicValid && serviceOk, serviceOk };
}
