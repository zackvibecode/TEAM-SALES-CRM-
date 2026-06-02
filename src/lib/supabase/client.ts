import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const { url, anonKey, valid } = getSupabasePublicEnv();
  if (!valid) {
    throw new Error(
      "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel."
    );
  }
  return createBrowserClient(url, anonKey);
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv().valid;
}
