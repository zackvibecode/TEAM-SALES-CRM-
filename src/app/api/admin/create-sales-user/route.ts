import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { getSupabaseServiceEnv, SERVICE_KEY_SETUP_HINT } from "@/lib/supabase/env";
import { mapAdminAuthError } from "@/lib/supabase/admin-errors";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if ("error" in authResult && authResult.error) return authResult.error;

    const svc = getSupabaseServiceEnv();
    if (!svc.valid) {
      return NextResponse.json({ error: SERVICE_KEY_SETUP_HINT }, { status: 500 });
    }

    const { email, password, full_name } = await request.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password || !full_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createDbClient();

    const { error: probeError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (probeError) {
      return NextResponse.json(
        { error: mapAdminAuthError(probeError.message) },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return NextResponse.json(
        { error: mapAdminAuthError(error.message) },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: normalizedEmail,
        full_name,
        role: "sales",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { error: `User created but profile failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ user_id: data.user.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
