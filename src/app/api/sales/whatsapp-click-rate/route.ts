import { NextResponse } from "next/server";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { countRecentWhatsAppClicks } from "@/lib/activity-log";
import {
  WHATSAPP_RATE_LIMIT,
  isRateLimitExceeded,
} from "@/lib/whatsapp-rate-limit";

export async function GET() {
  try {
    const auth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDbClient();
    const clickCount = await countRecentWhatsAppClicks(
      db,
      user.id,
      WHATSAPP_RATE_LIMIT.windowMinutes
    );

    return NextResponse.json({
      clickCount,
      maxClicks: WHATSAPP_RATE_LIMIT.maxClicks,
      windowMinutes: WHATSAPP_RATE_LIMIT.windowMinutes,
      warning: isRateLimitExceeded(clickCount),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
