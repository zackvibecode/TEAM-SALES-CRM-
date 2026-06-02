import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDbClient();
    const all: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await db
        .from("leads")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data?.length) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const { count } = await db
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("owner_user_id", user.id);

    return NextResponse.json({
      leads: all,
      total: count ?? all.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load leads";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
