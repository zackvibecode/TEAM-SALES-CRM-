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
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

function homeForRole(role: string) {
  return role === "admin" ? "/admin/dashboard" : "/dashboard/sales";
}

function dashboardRedirect(request: NextRequest, role: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = homeForRole(role);
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

async function resolveRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  request: NextRequest
): Promise<"admin" | "sales" | null> {
  // Check cached role from cookie (5 min TTL) to skip DB call on repeat requests
  const cachedRole = request.cookies.get("x-user-role")?.value;
  if (cachedRole === "admin" || cachedRole === "sales") {
    return cachedRole;
  }

  try {
    const { data: roleFromRpc } = await supabase.rpc("get_user_role", {
      user_id: userId,
    });
    if (roleFromRpc === "admin" || roleFromRpc === "sales") {
      return roleFromRpc;
    }
  } catch {
    // Fall through to profiles table.
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role === "admin" || profile?.role === "sales") {
      return profile.role;
    }
  } catch {
    return null;
  }

  return null;
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

  // Cookie-only session check for page routing (fast).
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user ?? null;

  // Admin API: always verify token with Supabase Auth.
  if (pathname.startsWith("/api/admin/")) {
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const role = await resolveRole(supabase, user.id, request);
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    supabaseResponse.cookies.set("x-user-role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    return supabaseResponse;
  }

  // Statics, OAuth discovery, auth callbacks, non-admin APIs: pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/")
  ) {
    return supabaseResponse;
  }

  // Public pages
  if (isPublicPath(pathname)) {
    // Keep marketing pages public even if logged in.
    if (pathname === "/" || pathname === "/pricing" || pathname.startsWith("/r/")) {
      return supabaseResponse;
    }

    // /login: if already authenticated, send to the right home.
    if (pathname === "/login" && sessionUser) {
      const role = await resolveRole(supabase, sessionUser.id, request);
      if (role) {
        const redirect = dashboardRedirect(request, role);
        redirect.cookies.set("x-user-role", role, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300,
          path: "/",
        });
        return redirect;
      }
      // Session exists but role missing — allow login page so user can recover.
      return supabaseResponse;
    }

    return supabaseResponse;
  }

  // Everything else needs a session
  if (!sessionUser) {
    return loginRedirect(request);
  }

  const role = await resolveRole(supabase, sessionUser.id, request);
  if (!role) {
    return loginRedirect(request);
  }

  supabaseResponse.cookies.set("x-user-role", role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  // Non-admins cannot open admin pages.
  if (pathname.startsWith("/admin") && role !== "admin") {
    return dashboardRedirect(request, role);
  }

  // Non-admins cannot open rotator-team pages.
  if (pathname.startsWith("/dashboard/rotator-team") && role !== "admin") {
    return dashboardRedirect(request, role);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
