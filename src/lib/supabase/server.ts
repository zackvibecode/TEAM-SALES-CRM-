import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "./env";

// For auth checks in server components (reads session from cookies)
export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// For admin-only database operations (bypasses RLS)
export function createDbClient() {
  const { url, serviceKey } = getSupabaseServiceEnv();
  return createClient(
    url,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
