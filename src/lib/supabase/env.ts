function isAnonKey(key: string) {
  return (
    key.length > 20 &&
    (key.startsWith("eyJ") || key.startsWith("sb_publishable_"))
  );
}

function isServiceKey(key: string) {
  return (
    key.length > 20 &&
    (key.startsWith("eyJ") || key.startsWith("sb_secret_"))
  );
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
