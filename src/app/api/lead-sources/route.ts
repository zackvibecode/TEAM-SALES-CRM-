import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data, error } = await supabase
      .from("lead_sources")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sources: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load lead sources";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
