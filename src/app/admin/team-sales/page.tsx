import { createDbClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { TeamSalesReport } from "@/components/team-sales/TeamSalesReport";
import { getAppCopy } from "@/lib/i18n/get-copy";
import { PageHeader } from "@/components/shared/PageHeader";
import { headers } from "next/headers";

export const revalidate = 60;

export default async function AdminTeamSalesPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();
  const host = (await headers()).get("host") || "localhost";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const [salesRes, profilesRes] = await Promise.all([
    fetch(`${baseUrl}/api/team-sales`, {
      headers: { cookie: (await headers()).get("cookie") || "" },
      cache: "no-store",
    }),
    db.from("profiles").select("id, full_name").in("role", ["sales"]).order("full_name"),
  ]);

  const { sales } = await salesRes.json();
  const copy = getAppCopy("en");

  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader
          badge={copy.sales.teamSales.badge}
          title={copy.sales.teamSales.title}
          subtitle={copy.sales.teamSales.subtitle}
          compact
        />
        <TeamSalesReport
          initialSales={sales || []}
          currentUserId={user.id}
          role="admin"
          salesUsers={(profilesRes.data || []).map((p: { id: string; full_name: string }) => ({
            id: p.id,
            full_name: p.full_name,
          }))}
          labels={{
            title: copy.sales.teamSales.title,
            subtitle: copy.sales.teamSales.subtitle,
            addSale: copy.sales.teamSales.addSale,
            editSale: copy.sales.teamSales.editSale,
            salesPerson: copy.sales.teamSales.salesPerson,
            packageName: copy.sales.teamSales.packageName,
            customerName: copy.sales.teamSales.customerName,
            leadSource: copy.sales.teamSales.leadSource,
            saleAmount: copy.sales.teamSales.saleAmount,
            pax: copy.sales.teamSales.pax,
            notes: copy.sales.teamSales.notes,
            totalTeamSales: copy.sales.teamSales.totalTeamSales,
            totalAmount: copy.sales.teamSales.totalAmount,
            yourSales: copy.sales.teamSales.yourSales,
            save: copy.sales.teamSales.save,
            cancel: copy.sales.teamSales.cancel,
            date: copy.sales.teamSales.date,
            actions: copy.sales.teamSales.actions,
            deleteConfirm: copy.sales.teamSales.deleteConfirm,
            filterByUser: copy.sales.teamSales.filterByUser,
            all: copy.sales.teamSales.all,
            noSales: copy.sales.teamSales.noSales,
            exportExcel: copy.sales.teamSales.exportExcel,
          }}
        />
      </div>
    </AppLayout>
  );
}
