import { createServerSupabaseClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { SalesPageShell } from "@/components/i18n/PageShells";
import { TeamSalesReport } from "@/components/team-sales/TeamSalesReport";
import { getAppCopy } from "@/lib/i18n/get-copy";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TeamSalesPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const host = (await headers()).get("host") || "localhost";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/team-sales`, {
    headers: { cookie: (await headers()).get("cookie") || "" },
    cache: "no-store",
  });
  const { sales } = await res.json();

  const copy = getAppCopy("en");

  return (
    <AppLayout role="sales">
      <SalesPageShell section="teamSales" className="space-y-6">
        <TeamSalesReport
          initialSales={sales || []}
          currentUserId={user.id}
          role="sales"
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
      </SalesPageShell>
    </AppLayout>
  );
}
