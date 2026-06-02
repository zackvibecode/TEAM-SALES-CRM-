export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const valid =
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    anonKey.length > 20;
  return { url, anonKey, valid };
}

export function getSupabaseServiceEnv() {
  const { url, valid: publicValid } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return { url, serviceKey, valid: publicValid && serviceKey.length > 20 };
}
