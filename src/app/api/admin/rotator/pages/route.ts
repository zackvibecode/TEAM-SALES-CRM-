import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_ROTATOR_MESSAGE } from "@/types/rotator";
import { slugifyRotatorName } from "@/lib/rotator/whatsapp";
import { DEFAULT_LOADING_TEXT, normalizeImageSize } from "@/lib/rotator/display";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { data, error } = await auth.db
      .from("rotator_pages")
      .select("*, rotator_page_sales(id, sales_member_id, rotation_order, is_active)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ pages: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load pages";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function extractDbError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return "Failed to create page";
}

function formatRotatorPageError(err: unknown, action: "create" | "update"): string {
  const raw = extractDbError(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";

  if (code === "23505" || raw.includes("rotator_pages_slug_key") || raw.includes("duplicate key")) {
    return "Slug ini sudah digunakan. Sila guna slug lain.";
  }

  return raw || (action === "create" ? "Failed to create page" : "Failed to update page");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const slug = (body.slug as string)?.trim() || slugifyRotatorName(name || "");
    const imageUrl = body.image_url || null;
    const defaultMessage = (body.default_message as string)?.trim() || DEFAULT_ROTATOR_MESSAGE;
    const loadingText = (body.loading_text as string)?.trim() || DEFAULT_LOADING_TEXT;
    const imageSize = normalizeImageSize((body.image_size as string) || "large");
    const isActive = body.is_active !== false;
    const salesMemberIds: string[] = body.sales_member_ids || [];

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { data: existingSlug } = await auth.db
      .from("rotator_pages")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug ini sudah digunakan. Sila guna slug lain." },
        { status: 409 }
      );
    }

    const { data: page, error } = await auth.db
      .from("rotator_pages")
      .insert({
        name,
        slug,
        image_url: imageUrl,
        default_message: defaultMessage,
        loading_text: loadingText,
        image_size: imageSize,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    if (salesMemberIds.length) {
      const assignments = salesMemberIds.map((id: string, i: number) => ({
        rotator_page_id: page.id,
        sales_member_id: id,
        rotation_order: i + 1,
        is_active: true,
      }));
      const { error: salesError } = await auth.db.from("rotator_page_sales").insert(assignments);
      if (salesError) {
        await auth.db.from("rotator_pages").delete().eq("id", page.id);
        throw salesError;
      }
    }

    const { error: stateError } = await auth.db.from("rotator_rotation_state").insert({
      rotator_page_id: page.id,
      last_index: -1,
    });
    if (stateError) {
      await auth.db.from("rotator_pages").delete().eq("id", page.id);
      throw stateError;
    }

    return NextResponse.json({ page });
  } catch (err: unknown) {
    const msg = formatRotatorPageError(err, "create");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = body.id as string;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = (body.name as string).trim();
    if (body.slug !== undefined) {
      const nextSlug = (body.slug as string).trim();
      const { data: slugTaken } = await auth.db
        .from("rotator_pages")
        .select("id")
        .eq("slug", nextSlug)
        .neq("id", id)
        .maybeSingle();
      if (slugTaken) {
        return NextResponse.json(
          { error: "Slug ini sudah digunakan. Sila guna slug lain." },
          { status: 409 }
        );
      }
      updates.slug = nextSlug;
    }
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.default_message !== undefined) updates.default_message = body.default_message;
    if (body.loading_text !== undefined) updates.loading_text = (body.loading_text as string).trim() || DEFAULT_LOADING_TEXT;
    if (body.image_size !== undefined) updates.image_size = normalizeImageSize(body.image_size as string);
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data: page, error } = await auth.db
      .from("rotator_pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (Array.isArray(body.sales_member_ids)) {
      await auth.db.from("rotator_page_sales").delete().eq("rotator_page_id", id);
      const assignments = (body.sales_member_ids as string[]).map((memberId, i) => ({
        rotator_page_id: id,
        sales_member_id: memberId,
        rotation_order: i + 1,
        is_active: true,
      }));
      if (assignments.length) {
        const { error: salesError } = await auth.db.from("rotator_page_sales").insert(assignments);
        if (salesError) throw salesError;
      }
    }

    return NextResponse.json({ page });
  } catch (err: unknown) {
    const msg = formatRotatorPageError(err, "update");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const { error } = await auth.db.from("rotator_pages").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete page";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
