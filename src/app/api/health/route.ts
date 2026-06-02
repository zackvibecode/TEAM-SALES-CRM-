import { NextResponse } from "next/server";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "@/lib/supabase/env";

export async function GET() {
  const pub = getSupabasePublicEnv();
  const svc = getSupabaseServiceEnv();

  const hints: string[] = [];
  if (!pub.url) hints.push("Missing NEXT_PUBLIC_SUPABASE_URL in Vercel.");
  else if (!pub.urlOk) hints.push("NEXT_PUBLIC_SUPABASE_URL must start with https:// and contain supabase.");
  if (!pub.anonKey) hints.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
  else if (pub.anonKey.startsWith("sb_publishable"))
    hints.push("Use Legacy anon key (eyJ...), not Publishable (sb_publishable_).");
  else if (!pub.anonOk) hints.push("NEXT_PUBLIC_SUPABASE_ANON_KEY must be the Legacy anon JWT (starts with eyJ).");
  if (!svc.serviceKey) hints.push("Missing SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  else if (svc.serviceKey.startsWith("sb_secret"))
    hints.push("Use Legacy service_role key (eyJ...), not Secret (sb_secret_).");
  else if (!svc.serviceOk)
    hints.push("SUPABASE_SERVICE_ROLE_KEY must be Legacy service_role JWT (starts with eyJ).");

  if (hints.length > 0) {
    hints.push("After fixing: Vercel → Deployments → Redeploy.");
  }

  return NextResponse.json({
    ok: pub.valid && svc.valid,
    supabase: {
      hasUrl: Boolean(pub.url),
      hasAnonKey: Boolean(pub.anonKey),
      anonLooksLegacy: pub.anonKey.startsWith("eyJ"),
      hasServiceKey: Boolean(svc.serviceKey),
      serviceLooksLegacy: svc.serviceKey.startsWith("eyJ"),
    },
    hints: hints.length > 0 ? hints : undefined,
    hint: hints[0],
  });
}
