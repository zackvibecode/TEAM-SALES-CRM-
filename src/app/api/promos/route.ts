import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import { departureRowsToStored, mytDateInputToISO } from "@/lib/promo/countdown";
import {
  canModifyPromo,
  createPromo,
  deletePromo,
  getPromoById,
  listPromos,
  updatePromo,
} from "@/lib/promo/service";
import type { PromoDepartureEntry, PromoDepartureRow } from "@/types/promo";

function parseDepartureEntries(input: Record<string, unknown>): PromoDepartureEntry[] {
  const raw = input.departure_dates;
  if (Array.isArray(raw)) {
    const rows: PromoDepartureRow[] = raw
      .map((item) => {
        if (typeof item === "string") {
          return { name: "", date: item };
        }
        if (item && typeof item === "object") {
          const obj = item as { name?: unknown; date?: unknown };
          return {
            name: typeof obj.name === "string" ? obj.name : "",
            date: typeof obj.date === "string" ? obj.date : "",
          };
        }
        return null;
      })
      .filter((row): row is PromoDepartureRow => row !== null);
    return departureRowsToStored(rows);
  }

  if (input.ends_at === null || input.ends_at === "") return [];
  if (typeof input.ends_at === "string") {
    const date =
      /^\d{4}-\d{2}-\d{2}$/.test(input.ends_at) ? mytDateInputToISO(input.ends_at) : input.ends_at;
    return [{ name: "", date }];
  }

  return [];
}

function parseBody(input: Record<string, unknown>) {
  const departure_dates = parseDepartureEntries(input);
  const firstName = departure_dates.find((entry) => entry.name)?.name;
  const title = ((input.title as string)?.trim() || firstName || "Package").trim();
  const promo_text = (input.promo_text as string)?.trim() ?? "";
  const poster_url = (input.poster_url as string) || null;
  const is_active = input.is_active !== false;
  const sort_order = Number(input.sort_order ?? 0);

  return { title, promo_text, poster_url, is_active, sort_order, departure_dates };
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
