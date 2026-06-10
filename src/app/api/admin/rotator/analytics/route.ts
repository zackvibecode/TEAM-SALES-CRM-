import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRotatorAnalytics, getPageClickStats, getSalesClickStats } from "@/lib/rotator/analytics";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      pageId: searchParams.get("pageId") || undefined,
      salesMemberId: searchParams.get("salesMemberId") || undefined,
      source: searchParams.get("source") || undefined,
      campaign: searchParams.get("campaign") || undefined,
    };

    const [analytics, pagesRes, membersRes] = await Promise.all([
      getRotatorAnalytics(auth.db, filters),
      auth.db.from("rotator_pages").select("id, name, slug, is_active").order("name"),
      auth.db.from("rotator_sales_members").select("id, name, phone, is_active, rotation_order").order("rotation_order"),
    ]);

    const pages = pagesRes.data || [];
    const members = membersRes.data || [];

    const [pageStats, salesStats] = await Promise.all([
      getPageClickStats(auth.db, pages.map((p) => p.id)),
      getSalesClickStats(auth.db, members.map((m) => m.id)),
    ]);

    const pageMap = Object.fromEntries(pages.map((p) => [p.id, p]));

    const latestActivity = analytics.clicks.slice(0, 50).map((c) => ({
      id: c.id,
      clicked_at: c.clicked_at,
      page_name: pageMap[c.rotator_page_id]?.name || "-",
      sales_name: c.sales_name || "-",
      source: c.source,
      campaign: c.campaign,
      is_duplicate: c.is_duplicate,
    }));

    return NextResponse.json({
      stats: {
        totalClicks: analytics.totalClicks,
        uniqueClicks: analytics.uniqueClicks,
        duplicateClicks: analytics.duplicateClicks,
        todayClicks: analytics.todayClicks,
        monthClicks: analytics.monthClicks,
      },
      pages: pages.map((p) => ({
        ...p,
        public_url: `/r/${p.slug}`,
        total_clicks: pageStats[p.id]?.total || 0,
        unique_clicks: pageStats[p.id]?.unique || 0,
      })),
      salesPerformance: members.map((m) => ({
        ...m,
        total_assigned: salesStats[m.id]?.total || 0,
        unique_clicks: salesStats[m.id]?.unique || 0,
        duplicate_clicks: salesStats[m.id]?.duplicate || 0,
      })),
      latestActivity,
      filterOptions: {
        pages,
        members,
        sources: [...new Set(analytics.clicks.map((c) => c.source))],
        campaigns: [...new Set(analytics.clicks.map((c) => c.campaign))],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
