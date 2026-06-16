import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let query = ctx.db
      .from("team_sales")
      .select("*, profiles!team_sales_sales_user_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("sales_user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sales = (data || []).map((row: Record<string, unknown>) => {
      const profile = row.profiles as { full_name?: string } | null;
      return {
        ...row,
        profiles: undefined,
        sales_user_name: profile?.full_name ?? "Unknown",
      };
    });

    return NextResponse.json({ sales });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load team sales";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const package_name = (body.package_name as string)?.trim();
    const lead_source = (body.lead_source as string)?.trim() ?? "";
    const sale_amount = Number(body.sale_amount ?? 0);
    const pax = Number(body.pax ?? 1) || 1;
    const customer_name = (body.customer_name as string)?.trim() ?? "";
    const notes = (body.notes as string)?.trim() ?? "";

    if (!package_name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 });
    }

    const salesUserId =
      ctx.role === "admin" && body.sales_user_id
        ? (body.sales_user_id as string)
        : ctx.user.id;

    const insertPayload = {
      sales_user_id: salesUserId,
      package_name,
      lead_source,
      sale_amount,
      pax,
      customer_name,
      notes,
    };

    console.log("[team-sales POST] insert payload:", JSON.stringify(insertPayload));

    const { data, error } = await ctx.db
      .from("team_sales")
      .insert(insertPayload)
      .select("*, profiles!team_sales_sales_user_id_fkey(full_name)")
      .single();

    if (error) {
      console.error("[team-sales POST] db error:", error);
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
    }

    const profile = (data as Record<string, unknown>).profiles as { full_name?: string } | null;
    const sale = {
      ...(data as Record<string, unknown>),
      profiles: undefined,
      sales_user_name: profile?.full_name ?? "Unknown",
    };

    return NextResponse.json({ sale });
  } catch (err: unknown) {
    console.error("[team-sales POST] unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create team sale";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
