import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RotatorSubNav } from "@/components/rotator/RotatorSubNav";
import { RotatorPagesClient } from "./client";
import { createDbClient } from "@/lib/supabase/server";
import { getPageClickStats } from "@/lib/rotator/analytics";

export const dynamic = "force-dynamic";

export default async function RotatorPagesListPage() {
  const db = createDbClient();

  const { data: pages, error: pagesError } = await db
    .from("rotator_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (pagesError) {
    return (
      <AppLayout role="admin">
        <div className="dashboard-shell space-y-6">
          <PageHeader badge="Admin" title="Rotator Team" subtitle="Manage landing pages" compact />
          <RotatorSubNav />
          <p className="text-sm text-red-600 card-padded">
            Gagal memuatkan pages: {pagesError.message}
          </p>
        </div>
      </AppLayout>
    );
  }

  let pageStats: Record<string, { total: number; unique: number }> = {};
  try {
    pageStats = await getPageClickStats(db, (pages || []).map((p) => p.id));
  } catch {
    pageStats = {};
  }

  const salesCountByPage: Record<string, number> = {};
  if (pages?.length) {
    const { data: pageSales } = await db
      .from("rotator_page_sales")
      .select("rotator_page_id, is_active, rotator_sales_members(is_active)")
      .in("rotator_page_id", pages.map((p) => p.id));

    for (const row of pageSales || []) {
      const member = row.rotator_sales_members as { is_active?: boolean } | null;
      if (row.is_active && member?.is_active) {
        salesCountByPage[row.rotator_page_id] = (salesCountByPage[row.rotator_page_id] || 0) + 1;
      }
    }
  }

  const enriched = (pages || []).map((p) => ({
    ...p,
    public_url: `/r/${p.slug}`,
    total_clicks: pageStats[p.id]?.total || 0,
    unique_clicks: pageStats[p.id]?.unique || 0,
    assigned_sales_count: salesCountByPage[p.id] || 0,
  }));

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader
          badge="Admin"
          title="Rotator Team"
          subtitle="Manage WhatsApp rotator landing pages"
          compact
          actions={
            <Link href="/dashboard/rotator-team/pages/new" className="btn-primary-solid text-sm">
              + New Page
            </Link>
          }
        />
        <RotatorSubNav />
        <RotatorPagesClient initialPages={enriched} />
      </div>
    </AppLayout>
  );
}
