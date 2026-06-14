import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);
    const unreadOnly = searchParams.get("unread") === "true";

    let query = ctx.db
      .from("notifications")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;

    const { count } = await ctx.db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", ctx.user.id)
      .eq("is_read", false);

    return NextResponse.json({ notifications: data ?? [], unreadCount: count ?? 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load notifications";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { id, markAll } = body;

    if (markAll) {
      const { error } = await ctx.db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", ctx.user.id)
        .eq("is_read", false);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (id) {
      const { error } = await ctx.db
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", ctx.user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "id or markAll required" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
