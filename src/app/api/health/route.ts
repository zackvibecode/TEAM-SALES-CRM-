import { NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

export async function GET() {
  const pub = getSupabasePublicEnv();
  const svc = getSupabaseServiceEnv();

  return NextResponse.json({
    ok: pub.valid && svc.valid,
    supabase: {
      hasUrl: Boolean(pub.url),
      hasAnonKey: Boolean(pub.anonKey),
      urlLooksValid: pub.url.startsWith("https://") && pub.url.includes(".supabase.co"),
      hasServiceKey: Boolean(svc.serviceKey),
    },
    hint: !pub.valid
      ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then Redeploy."
      : undefined,
  });
}
