import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

function applyCookies(
  target: NextResponse,
  cookiesToApply: { name: string; value: string; options?: CookieOptions }[]
) {
  cookiesToApply.forEach(({ name, value, options }) => {
    target.cookies.set(name, value, options);
  });
}

export async function GET(request: NextRequest) {
  const { url, anonKey, valid } = getSupabasePublicEnv();
  if (!valid) {
    return NextResponse.json({ user: null, configured: false });
  }

  const cookiesToApply: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach((cookie) => {
          cookiesToApply.push(cookie);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const out = NextResponse.json({ user: null, configured: true });
    applyCookies(out, cookiesToApply);
    return out;
  }

  let role: string | null = null;
  const { data: roleFromRpc } = await supabase.rpc("get_user_role", { user_id: user.id });
  role = (roleFromRpc as string) || null;

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const out = NextResponse.json({
    user: { id: user.id, email: user.email },
    role,
    configured: true,
  });

  applyCookies(out, cookiesToApply);
  return out;
}
