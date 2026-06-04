import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { BRAND_WHATSAPP_INTRO } from "@/lib/brand";
import { WHATSAPP_PRETEXT_MAX_LENGTH } from "@/lib/whatsapp-pretext";

export const dynamic = "force-dynamic";

function jsonNoStore(body: Record<string, unknown>, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return jsonNoStore({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error } = await ctx.db
      .from("profiles")
      .select("whatsapp_pretext")
      .eq("id", ctx.user.id)
      .single();

    if (error) {
      return jsonNoStore({ error: error.message }, { status: 500 });
    }

    return jsonNoStore({
      pretext: profile?.whatsapp_pretext ?? null,
      effectiveDefault: BRAND_WHATSAPP_INTRO,
      maxLength: WHATSAPP_PRETEXT_MAX_LENGTH,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load pretext";
    return jsonNoStore({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return jsonNoStore({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const raw = body.pretext;

    let value: string | null;
    if (raw === null || raw === undefined || raw === "") {
      value = null;
    } else if (typeof raw !== "string") {
      return jsonNoStore({ error: "pretext must be a string or null" }, { status: 400 });
    } else {
      const trimmed = raw.trim();
      if (!trimmed) {
        value = null;
      } else if (trimmed.length > WHATSAPP_PRETEXT_MAX_LENGTH) {
        return jsonNoStore(
          { error: `Message must be at most ${WHATSAPP_PRETEXT_MAX_LENGTH} characters` },
          { status: 400 }
        );
      } else {
        value = trimmed;
      }
    }

    const { data: profile, error } = await ctx.db
      .from("profiles")
      .update({ whatsapp_pretext: value })
      .eq("id", ctx.user.id)
      .select("whatsapp_pretext")
      .single();

    if (error) {
      return jsonNoStore({ error: error.message }, { status: 500 });
    }

    return jsonNoStore({
      pretext: profile?.whatsapp_pretext ?? null,
      effectiveDefault: BRAND_WHATSAPP_INTRO,
      maxLength: WHATSAPP_PRETEXT_MAX_LENGTH,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save pretext";
    return jsonNoStore({ error: msg }, { status: 500 });
  }
}
