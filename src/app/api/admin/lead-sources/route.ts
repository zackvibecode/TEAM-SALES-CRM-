import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function GET() {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (ctx.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const { data, error } = await ctx.db
      .from("lead_sources")
      .select("*")
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sources: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load lead sources";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (ctx.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const is_active = body.is_active ?? true;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { data, error } = await ctx.db
      .from("lead_sources")
      .insert({ name, is_active, created_by: ctx.user.id })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Lead source already exists" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ source: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create lead source";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
