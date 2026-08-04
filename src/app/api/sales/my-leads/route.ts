import { NextResponse } from "next/server";
import { debugSessionLog } from "@/lib/debug-log";
import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_TTL, cacheKeys } from "@/lib/cache/keys";

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

    const payload = await cachedGet(
      cacheKeys.myLeads(user.id),
      CACHE_TTL.LEADS,
      async () => {
        const all: Record<string, unknown>[] = [];
        const pageSize = 1000;
        let from = 0;

        while (true) {
          const { data, error } = await db
            .from("leads")
            .select("*")
            .eq("owner_user_id", user.id)
            .order("created_at", { ascending: true })
            .range(from, from + pageSize - 1);

          if (error) {
            throw new Error(error.message);
          }
          if (!data?.length) break;
          all.push(...data);
          if (data.length < pageSize) break;
          from += pageSize;
        }

        const { count } = await db
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("owner_user_id", user.id);

        return {
          leads: all,
          total: count ?? all.length,
        };
      }
    );

    const yearCounts: Record<number, number> = {};
    for (const row of payload.leads) {
      const y = new Date(String(row.created_at)).getFullYear();
      if (y > 1970) yearCounts[y] = (yearCounts[y] || 0) + 1;
    }

    debugSessionLog({
      hypothesisId: "H-DISPLAY",
      location: "my-leads/route.ts:GET",
      message: "leads loaded for sales",
      data: {
        count: payload.leads.length,
        yearCounts,
        sample: payload.leads.slice(0, 2).map((r) => ({
          name: r.name,
          created_at: r.created_at,
        })),
      },
    });

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load leads";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
