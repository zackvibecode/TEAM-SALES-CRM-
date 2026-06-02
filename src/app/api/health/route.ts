import { NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

export async function GET() {
  const pub = getSupabasePublicEnv();
  const svc = getSupabaseServiceEnv();

  const hints: string[] = [];
  if (!pub.url) hints.push("Missing NEXT_PUBLIC_SUPABASE_URL in Vercel.");
  else if (!pub.urlOk) hints.push("NEXT_PUBLIC_SUPABASE_URL must be https://....supabase.co");
  if (!pub.anonKey) hints.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
  else if (!pub.anonOk)
    hints.push("ANON key must be Legacy (eyJ...) or Publishable (sb_publishable_).");
  if (!svc.serviceKey) hints.push("Missing SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  else if (!svc.serviceOk)
    hints.push("SERVICE key must be Legacy (eyJ...) or Secret (sb_secret_).");

  if (hints.length > 0) {
    hints.push("Vercel → Deployments → Redeploy after saving.");
  }

  return NextResponse.json({
    ok: pub.valid && svc.valid,
    supabase: {
      hasUrl: Boolean(pub.url),
      hasAnonKey: Boolean(pub.anonKey),
      hasServiceKey: Boolean(svc.serviceKey),
    },
    hints: hints.length > 0 ? hints : undefined,
    hint: hints[0],
  });
}
