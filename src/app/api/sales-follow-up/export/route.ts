import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { getLeads, getPicPerformance } from "@/lib/sales-follow-up/service";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import type { FollowUpFilterParams } from "@/lib/sales-follow-up/types";

function csvEscape(cell: string | number | null | undefined): string {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const report = searchParams.get("report") || "leads";

  const scoped = await resolveScopedPicId(
    ctx.db,
    ctx.role,
    ctx.user.id,
    searchParams.get("picId")
  );
  if (scoped.error) {
    return NextResponse.json({ error: scoped.error }, { status: 403 });
  }

  // PIC name lookup for the follow-up activity report
  const { data: allPics } = await ctx.db.from("sales_pics").select("id, name");
  const picsById = new Map(
    ((allPics ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name])
  );

  const filters: FollowUpFilterParams = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    picId: scoped.picId,
    status: searchParams.get("status") as FollowUpFilterParams["status"],
    packageFilter: searchParams.get("packageFilter") || undefined,
    followUpFilter:
      (searchParams.get("followUpFilter") as FollowUpFilterParams["followUpFilter"]) || undefined,
  };

  try {
    if (report === "performance") {
      let data = await getPicPerformance(ctx.db, filters);
      if (ctx.role === "sales" && scoped.picId) {
        data = data.filter((row) => row.pic_id === scoped.picId);
      }

      if (format === "csv") {
        const headers = [
          "PIC",
          "Leads Assigned",
          "Total Follow-Up Activities",
          "Leads Followed Up",
          "Leads With At Least 3 Follow-Ups",
          "No Follow-Up",
          "Overdue",
          "Completion Rate",
        ];

        const rows = data.map((row) => [
          row.pic_name,
          row.leads_assigned,
          row.total_follow_up_activities,
          row.leads_followed_up,
          row.leads_with_three_plus,
          row.no_follow_up,
          row.overdue,
          `${row.completion_rate}%`,
        ]);

        const csvContent = [headers, ...rows]
          .map((row) => row.map((cell) => csvEscape(cell)).join(","))
          .join("\n");

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="pic-performance-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }

      return NextResponse.json({ performance: data });
    }

    // maxLeads tinggi — export perlu SEMUA leads, bukan 1000 pertama sahaja
    const leads = await getLeads(ctx.db, { ...filters, maxLeads: 100_000 });

    // Follow-up activity report: one row per follow-up with date and time split
    // into separate columns for easy Excel/CSV filtering.
    if (report === "followups") {
      const leadIds = leads.map((l) => l.id);
      const rows: Array<{
        lead_id: string;
        follow_up_number: number;
        status: string;
        created_at: string;
        follow_up_date: string;
        notes: string;
        pic: string;
      }> = [];
      for (let i = 0; i < leadIds.length; i += 200) {
        const chunk = leadIds.slice(i, i + 200);
        const { data: fuRows, error: fuErr } = await ctx.db
          .from("lead_follow_ups")
          .select("lead_id, follow_up_number, status, created_at, follow_up_date, notes, pic_id")
          .in("lead_id", chunk)
          .order("created_at", { ascending: true });
        if (fuErr) throw new Error(`Failed to fetch follow-ups: ${fuErr.message}`);
        for (const r of (fuRows ?? []) as Array<{
          lead_id: string;
          follow_up_number: number;
          status: string;
          created_at: string;
          follow_up_date: string;
          notes: string;
          pic_id: string | null;
        }>) {
          rows.push({
            lead_id: r.lead_id,
            follow_up_number: r.follow_up_number,
            status: r.status,
            created_at: r.created_at,
            follow_up_date: r.follow_up_date,
            notes: r.notes ?? "",
            pic: picsById.get(r.pic_id ?? "") ?? "",
          });
        }
      }

      const leadById = new Map(leads.map((l) => [l.id, l]));
      const headers = [
        "Customer Name",
        "Phone Number",
        "PIC",
        "Lead Status",
        "Follow-Up #",
        "Follow-Up Response",
        "Notes",
        "Date",
        "Time",
        "Follow-Up Date (scheduled)",
        "Lead Created Date",
        "Lead Created Time",
      ];

      const csvRows = rows.map((r) => {
        const lead = leadById.get(r.lead_id);
        const created = new Date(r.created_at);
        const leadCreated = new Date(lead?.created_at ?? "");
        return [
          lead?.customer_name ?? "",
          lead?.phone_number ?? "",
          r.pic || lead?.assigned_pic?.name || "",
          lead?.lead_status ?? "",
          r.follow_up_number,
          r.status,
          r.notes,
          created.toLocaleDateString("en-GB"),
          created.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
          r.follow_up_date ?? "",
          Number.isNaN(leadCreated.getTime()) ? "" : leadCreated.toLocaleDateString("en-GB"),
          Number.isNaN(leadCreated.getTime())
            ? ""
            : leadCreated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
        ];
      });

      const csvContent = [headers, ...csvRows]
        .map((row) => row.map((cell) => csvEscape(cell)).join(","))
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="follow-up-activities-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (format === "csv") {
      const headers = [
        "Customer Name",
        "Phone Number",
        "Destination / Product",
        "Source",
        "PIC",
        "Lead Status",
        "Total Follow-Ups",
        "Next Follow-Up Date",
        "Last Follow-Up Date",
        "Latest Response",
        "Created At",
      ];

      const rows = leads.map((lead) => [
        lead.customer_name,
        lead.phone_number,
        lead.destination_or_product,
        lead.source,
        lead.assigned_pic?.name ?? "",
        lead.lead_status,
        lead.total_follow_ups,
        lead.next_follow_up_date ?? "",
        lead.last_follow_up_date ?? "",
        lead.latest_response,
        lead.created_at,
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => csvEscape(cell)).join(","))
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="follow-up-leads-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ leads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
