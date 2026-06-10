import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/supabase/server";
import { buildWhatsAppUrl } from "@/lib/rotator/whatsapp";
import type { RotatorAssignResult } from "@/types/rotator";

const DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

/** Public API: fair rotation assignment + click tracking */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = (body.slug as string)?.trim();
    const visitorId = (body.visitor_id as string) || null;
    const source = (body.source as string) || "direct";
    const campaign = (body.campaign as string) || "none";
    const referrer = (body.referrer as string) || request.headers.get("referer") || null;
    const userAgent = (body.user_agent as string) || request.headers.get("user-agent") || null;

    if (!slug) {
      return NextResponse.json({ success: false, error: "missing_slug" }, { status: 400 });
    }

    const db = createDbClient();

    const { data: page, error: pageError } = await db
      .from("rotator_pages")
      .select("id, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (pageError) throw pageError;
    if (!page) {
      return NextResponse.json({ success: false, error: "page_not_found" }, { status: 404 });
    }
    if (!page.is_active) {
      return NextResponse.json({ success: false, error: "page_inactive" }, { status: 403 });
    }

    // Return same sales assignment within 30 min — no extra rotation or click row
    if (visitorId) {
      const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
      const { data: recent } = await db
        .from("rotator_clicks")
        .select("sales_member_id, sales_name, sales_phone, whatsapp_message")
        .eq("rotator_page_id", page.id)
        .eq("visitor_id", visitorId)
        .gte("clicked_at", since)
        .order("clicked_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent?.sales_phone && recent?.whatsapp_message) {
        return NextResponse.json({
          success: true,
          sales_member_id: recent.sales_member_id,
          sales_name: recent.sales_name,
          sales_phone: recent.sales_phone,
          whatsapp_message: recent.whatsapp_message,
          is_duplicate: true,
          cached: true,
          whatsapp_url: buildWhatsAppUrl(recent.sales_phone, recent.whatsapp_message),
        });
      }
    }

    const { data: result, error: rpcError } = await db.rpc("assign_next_rotator_sales", {
      p_rotator_page_id: page.id,
      p_visitor_id: visitorId,
      p_source: source,
      p_campaign: campaign,
      p_referrer: referrer,
      p_user_agent: userAgent,
    });

    if (rpcError) throw rpcError;

    const assigned = result as RotatorAssignResult;
    if (!assigned.success) {
      const status =
        assigned.error === "page_not_found" ? 404 :
        assigned.error === "page_inactive" ? 403 :
        assigned.error === "no_active_sales" ? 503 : 500;
      return NextResponse.json(assigned, { status });
    }

    const whatsappUrl = buildWhatsAppUrl(
      assigned.sales_phone!,
      assigned.whatsapp_message!
    );

    return NextResponse.json({ ...assigned, whatsapp_url: whatsappUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Assignment failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
