import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/r/");
}

function loginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  return NextResponse.redirect(redirectUrl);
}

function dashboardRedirect(request: NextRequest, role: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = role === "admin" ? "/admin/dashboard" : "/dashboard/sales";
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const { url, anonKey, valid } = getSupabasePublicEnv();
  const pathname = request.nextUrl.pathname;

  if (!valid) {
    if (pathname.startsWith("/api/health") || isPublicPath(pathname)) {
      return NextResponse.next();
    }
    return loginRedirect(request);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Fast cookie-only session check — no network round-trip
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user ?? null;

  // Admin API: always verify token with Supabase
  if (pathname.startsWith("/api/admin/")) {
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Authorization failed" }, { status: 403 });
    }
    return supabaseResponse;
  }

  // Statics, auth callbacks, non-admin APIs: pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/")
  ) {
    return supabaseResponse;
  }

  // Public pages: pass through (logged-in users get redirected later)
  if (isPublicPath(pathname)) {
    if (sessionUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/sales";
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // Everything else needs a session
  if (!sessionUser) {
    return loginRedirect(request);
  }

  // Protect /admin & /dashboard routes by role
  let role: string | null = null;
  try {
    const { data: roleFromRpc } = await supabase
      .rpc("get_user_role", { user_id: sessionUser.id });
    role = (roleFromRpc as string) || null;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
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
    return dashboardRedirect(request, "sales");
  }
  if (
    (pathname.startsWith("/dashboard/sales") || pathname.startsWith("/dashboard/rotator-team")) &&
    role !== "admin"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/sales";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/login") {
    return dashboardRedirect(request, role);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
