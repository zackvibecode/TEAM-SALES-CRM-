import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function POST(request: NextRequest) {
  const { url, anonKey, valid } = getSupabasePublicEnv();
  if (!valid) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: Supabase env vars missing on Vercel. Add them and Redeploy.",
      },
      { status: 503 }
    );
  }

  let email: string;
  let password: string;
  try {
    const body = await request.json();
    email = String(body.email || "").trim();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const response = NextResponse.json({ success: false });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  if (!data.user) {
    return NextResponse.json({ error: "Login failed" }, { status: 401 });
  }

  let role: string | null = null;
  const { data: roleFromRpc, error: rpcError } = await supabase.rpc("get_user_role", {
    user_id: data.user.id,
  });
  if (!rpcError && roleFromRpc) {
    role = roleFromRpc as string;
  }

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  if (!role) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error:
          "No role on this account. In Supabase profiles set role=admin or run migration 003.",
      },
      { status: 403 }
    );
  }

  const success = NextResponse.json({
    success: true,
    role,
    email: data.user.email,
  });

  response.cookies.getAll().forEach((cookie) => {
    success.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
    });
  });

  return success;
}
