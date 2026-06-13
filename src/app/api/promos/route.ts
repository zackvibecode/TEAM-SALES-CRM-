import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import { mytDateInputToISO } from "@/lib/promo/countdown";
import {
  canModifyPromo,
  createPromo,
  deletePromo,
  getPromoById,
  listPromos,
  updatePromo,
} from "@/lib/promo/service";

function parseBody(input: Record<string, unknown>) {
  const title = (input.title as string)?.trim();
  const promo_text = (input.promo_text as string)?.trim() ?? "";
  const poster_url = (input.poster_url as string) || null;
  const is_active = input.is_active !== false;
  const sort_order = Number(input.sort_order ?? 0);
  let ends_at: string | null = null;

  if (input.ends_at === null || input.ends_at === "") {
    ends_at = null;
  } else if (typeof input.ends_at === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.ends_at)) {
      ends_at = mytDateInputToISO(input.ends_at);
    } else {
      ends_at = input.ends_at;
    }
  }

  return { title, promo_text, poster_url, is_active, sort_order, ends_at };
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const promos = await listPromos(ctx.db, { activeOnly, limit });
    return NextResponse.json({ promos });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load promos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const parsed = parseBody(body);

    if (!parsed.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const promo = await createPromo(ctx.db, ctx.user.id, parsed);

    if (ctx.role === "admin") {
      await logAudit({
        actorId: ctx.user.id,
        action: "create_promo",
        entityType: "promo",
        entityId: promo.id,
        details: { title: promo.title },
      });
    }

    return NextResponse.json({ promo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create promo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Promo id is required" }, { status: 400 });

    const existing = await getPromoById(ctx.db, id);
    if (!existing) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

    if (!canModifyPromo(ctx.role, ctx.user.id, existing)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = parseBody(body);

    if (!parsed.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const promo = await updatePromo(ctx.db, ctx.user.id, id, parsed);
    if (!promo) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

    if (ctx.role === "admin") {
      await logAudit({
        actorId: ctx.user.id,
        action: "update_promo",
        entityType: "promo",
        entityId: promo.id,
        details: { title: promo.title },
      });
    }

    return NextResponse.json({ promo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update promo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Promo id is required" }, { status: 400 });

    const existing = await getPromoById(ctx.db, id);
    if (!existing) return NextResponse.json({ error: "Promo not found" }, { status: 404 });

    if (!canModifyPromo(ctx.role, ctx.user.id, existing)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deletePromo(ctx.db, ctx.user.id, id);

    if (ctx.role === "admin") {
      await logAudit({
        actorId: ctx.user.id,
        action: "delete_promo",
        entityType: "promo",
        entityId: id,
        details: { title: existing.title },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete promo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
