import { NextResponse } from "next/server";
import {
  describeKeyFormat,
  getSupabasePublicEnv,
  getSupabaseServiceEnv,
} from "@/lib/supabase/env";

export async function GET() {
  const pub = getSupabasePublicEnv();
  const svc = getSupabaseServiceEnv();

  const hints: string[] = [];
  if (!pub.url) hints.push("Missing NEXT_PUBLIC_SUPABASE_URL in Vercel.");
  else if (!pub.urlOk) hints.push("NEXT_PUBLIC_SUPABASE_URL must be https://....supabase.co");
  if (!pub.anonKey) hints.push("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
  else if (!pub.anonOk) {
    const fmt = describeKeyFormat(pub.anonKey);
    if (fmt === "secret_in_wrong_slot") {
      hints.push(
        "ANON slot has a service secret (sb_secret_). Paste Legacy anon (eyJ...) or Publishable (sb_publishable_) instead."
      );
    } else {
      hints.push("ANON key must be Legacy (eyJ...) or Publishable (sb_publishable_).");
    }
  }
  if (!svc.serviceKey) hints.push("Missing SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  else if (svc.anonInServiceSlot) {
    hints.push(
      "SERVICE slot has the anon key. Paste service_role (Legacy eyJ... or sb_secret_) from Supabase API settings."
    );
  } else if (!svc.serviceOk) {
    hints.push("SERVICE key must be service_role (Legacy eyJ...) or Secret (sb_secret_).");
  }

  if (hints.length > 0) {
    hints.push("Vercel → Deployments → Redeploy after saving.");
  }

  const loginOk = pub.valid;

  return NextResponse.json({
    ok: loginOk && svc.valid,
    loginOk,
    supabase: {
      hasUrl: Boolean(pub.url),
      hasAnonKey: Boolean(pub.anonKey),
      hasServiceKey: Boolean(svc.serviceKey),
      anonKeyFormat: pub.anonKey ? describeKeyFormat(pub.anonKey) : "missing",
      serviceKeyFormat: svc.serviceKey ? describeKeyFormat(svc.serviceKey) : "missing",
      serviceKeyRole: svc.serviceKeyRole ?? undefined,
      anonInServiceSlot: svc.anonInServiceSlot || undefined,
    },
    hints: hints.length > 0 ? hints : undefined,
    hint: hints[0],
  });
}
