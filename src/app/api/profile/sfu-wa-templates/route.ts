import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import {
  SFU_WA_TEMPLATES,
  SFU_WA_TEMPLATE_MAX_LENGTH,
  normalizeSfuWaTemplates,
  type SfuWaTemplates,
} from "@/lib/sales-follow-up/whatsapp-messages";

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
      .select("sfu_wa_templates")
      .eq("id", ctx.user.id)
      .single();

    if (error) {
      // Column may not exist yet — return defaults only
      if (/sfu_wa_templates|schema cache|column/i.test(error.message)) {
        return jsonNoStore({
          templates: {},
          defaults: SFU_WA_TEMPLATES,
          maxLength: SFU_WA_TEMPLATE_MAX_LENGTH,
          setupRequired: true,
        });
      }
      return jsonNoStore({ error: error.message }, { status: 500 });
    }

    return jsonNoStore({
      templates: normalizeSfuWaTemplates(profile?.sfu_wa_templates),
      defaults: SFU_WA_TEMPLATES,
      maxLength: SFU_WA_TEMPLATE_MAX_LENGTH,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load templates";
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
    const raw = body.templates;

    if (raw !== null && raw !== undefined && typeof raw !== "object") {
      return jsonNoStore({ error: "templates must be an object or null" }, { status: 400 });
    }

    let value: SfuWaTemplates | null = null;
    if (raw && typeof raw === "object") {
      const normalized = normalizeSfuWaTemplates(raw);
      for (const key of ["1", "2", "3"] as const) {
        const text = (raw as Record<string, unknown>)[key];
        if (typeof text === "string" && text.trim().length > SFU_WA_TEMPLATE_MAX_LENGTH) {
          return jsonNoStore(
            {
              error: `Template FU${key} must be at most ${SFU_WA_TEMPLATE_MAX_LENGTH} characters`,
            },
            { status: 400 }
          );
        }
      }
      value = Object.keys(normalized).length > 0 ? normalized : null;
    }

    const { data: profile, error } = await ctx.db
      .from("profiles")
      .update({ sfu_wa_templates: value })
      .eq("id", ctx.user.id)
      .select("sfu_wa_templates")
      .single();

    if (error) {
      if (/sfu_wa_templates|schema cache|column/i.test(error.message)) {
        return jsonNoStore(
          {
            error: "Database column missing. Run sfu-wa-templates.sql in Supabase.",
            code: "SETUP_REQUIRED",
          },
          { status: 503 }
        );
      }
      return jsonNoStore({ error: error.message }, { status: 500 });
    }

    return jsonNoStore({
      templates: normalizeSfuWaTemplates(profile?.sfu_wa_templates),
      defaults: SFU_WA_TEMPLATES,
      maxLength: SFU_WA_TEMPLATE_MAX_LENGTH,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save templates";
    return jsonNoStore({ error: msg }, { status: 500 });
  }
}
