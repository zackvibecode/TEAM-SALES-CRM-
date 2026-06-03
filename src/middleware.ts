import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createDbClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth-context";

function loginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  return NextResponse.redirect(redirectUrl);
}

async function resolveRoleForUser(userId: string) {
  const db = createDbClient();
  return resolveUserRole(db, userId);
}

export async function middleware(request: NextRequest) {
  const { url, anonKey, valid } = getSupabasePublicEnv();
  const pathname = request.nextUrl.pathname;

  if (!valid) {
    if (pathname.startsWith("/api/health") || pathname === "/") {
      return NextResponse.next();
    }
    return loginRedirect(request);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (pathname.startsWith("/api/")) {
      return supabaseResponse;
    }
    return loginRedirect(request);
  }

  if (pathname.startsWith("/api/admin/")) {
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    try {
      const role = await resolveRoleForUser(user.id);
      if (role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Authorization failed" }, { status: 403 });
    }
    return supabaseResponse;
  }

  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/")
  ) {
    return supabaseResponse;
  }

  if (!user && pathname !== "/") {
    return loginRedirect(request);
  }

  if (user) {
    let role: string | null = null;
    try {
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
    } catch {
      return loginRedirect(request);
    }

    if (!role) {
      return loginRedirect(request);
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/sales";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname.startsWith("/dashboard/sales") && role !== "sales") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/dashboard";
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === "/") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = role === "admin" ? "/admin/dashboard" : "/dashboard/sales";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
