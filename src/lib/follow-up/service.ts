import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, toDateString, tomorrow } from "./dates";
import type { FollowUpFilterTab } from "./dates";
import type {
  ActivityLogActionType,
  FollowUpKpiStats,
  FollowUpRow,
  FollowUpSortKey,
} from "./types";

type Db = SupabaseClient;

export async function getProfileName(db: Db, userId: string): Promise<string> {
  const { data } = await db.from("profiles").select("full_name").eq("id", userId).single();
  return data?.full_name ?? "Unknown";
}

export async function logActivity(
  db: Db,
  params: {
    leadId: string;
    salesUserId: string;
    salesUserName: string;
    actionType: ActivityLogActionType;
    message: string;
    metadata?: Record<string, unknown>;
    oldStatus?: string | null;
    newStatus?: string | null;
  }
) {
  await db.from("activity_logs").insert({
    lead_id: params.leadId,
    sales_user_id: params.salesUserId,
    sales_user_name: params.salesUserName,
    action_type: params.actionType,
    message: params.message,
    metadata: params.metadata ?? {},
  });

  if (
    params.salesUserId &&
    (params.actionType === "whatsapp_clicked" || params.actionType === "follow_up_clicked")
  ) {
    await db.from("lead_activities").insert({
      lead_id: params.leadId,
      sales_user_id: params.salesUserId,
      activity_type: "whatsapp_clicked",
      old_status: params.oldStatus ?? null,
      new_status: params.newStatus ?? "Clicked",
      notes: params.message,
    });
  } else if (params.salesUserId && params.actionType === "follow_up_completed") {
    await db.from("lead_activities").insert({
      lead_id: params.leadId,
      sales_user_id: params.salesUserId,
      activity_type: "status_updated",
      old_status: params.oldStatus ?? null,
      new_status: params.newStatus ?? "Follow Up",
      notes: params.message,
    });
  }
}

export async function syncCampaignNameOnLead(db: Db, leadId: string) {
  const { data: lead } = await db
    .from("leads")
    .select("source_file_id, owner_user_id")
    .eq("id", leadId)
    .single();
  if (!lead) return;

  let campaignName: string | null = null;
  if (lead.source_file_id) {
    const { data: file } = await db
      .from("uploaded_files")
      .select("campaign_name")
      .eq("id", lead.source_file_id)
      .single();
    campaignName = file?.campaign_name ?? null;
  }
  const salesName = await getProfileName(db, lead.owner_user_id);
  await db
    .from("leads")
    .update({
      campaign_name: campaignName,
      assigned_sales_user_name: salesName,
    })
    .eq("id", leadId);
}

export async function getPendingFollowUp(db: Db, leadId: string) {
  const { data } = await db
    .from("follow_ups")
    .select("*")
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .order("follow_up_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Pending or overdue follow-up still owed — used to avoid duplicate scheduling. */
export async function getActiveFollowUp(db: Db, leadId: string) {
  const { data } = await db
    .from("follow_ups")
    .select("*")
    .eq("lead_id", leadId)
    .in("status", ["pending", "overdue"])
    .order("follow_up_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function createFollowUp(
  db: Db,
  params: {
    leadId: string;
    salesUserId: string;
    salesUserName: string;
    followUpDate: string;
    followUpNumber: number;
    note?: string | null;
  }
) {
  const { data, error } = await db
    .from("follow_ups")
    .insert({
      lead_id: params.leadId,
      sales_user_id: params.salesUserId,
      sales_user_name: params.salesUserName,
      follow_up_number: params.followUpNumber,
      follow_up_date: params.followUpDate,
      status: "pending",
      note: params.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function logWhatsAppClick(
  db: Db,
  params: {
    leadId: string;
    userId: string;
    userName: string;
    clickedFrom: "lead_card" | "follow_up_queue";
    phone: string;
  }
) {
  const { data: lead, error: fetchError } = await db
    .from("leads")
    .select(
      "id, owner_user_id, status, whatsapp, whatsapp_click_count, follow_up_count, next_follow_up_date"
    )
    .eq("id", params.leadId)
    .single();

  if (fetchError || !lead) throw new Error("Lead not found");

  const now = new Date().toISOString();
  const nextDate = lead.next_follow_up_date ?? tomorrow();
  const newClickCount = (lead.whatsapp_click_count ?? 0) + 1;
  const isFirstClick = (lead.whatsapp_click_count ?? 0) === 0;

  const leadUpdate: Record<string, unknown> = {
    status: lead.status === "Pending" ? "Clicked" : lead.status,
    clicked_at: now,
    clicked_by: params.userId,
    whatsapp_click_count: newClickCount,
    last_contacted_at: now,
    updated_at: now,
  };

  // Only the first WhatsApp click schedules a follow-up mission.
  if (isFirstClick) {
    leadUpdate.follow_up_status = "pending";
    leadUpdate.next_follow_up_date = lead.next_follow_up_date ?? nextDate;
  }

  const { data: updated, error: updateError } = await db
    .from("leads")
    .update(leadUpdate)
    .eq("id", params.leadId)
    .select("id, status, whatsapp, whatsapp_click_count, last_contacted_at, next_follow_up_date")
    .single();

  if (updateError) throw new Error(updateError.message);

  await syncCampaignNameOnLead(db, params.leadId);

  await logActivity(db, {
    leadId: params.leadId,
    salesUserId: params.userId,
    salesUserName: params.userName,
    actionType: "whatsapp_clicked",
    message: "WhatsApp button clicked",
    metadata: {
      phone: params.phone,
      whatsapp_click_count: newClickCount,
      clicked_from: params.clickedFrom,
    },
    oldStatus: lead.status,
    newStatus: updated?.status ?? "Clicked",
  });

  if (isFirstClick) {
    await logActivity(db, {
      leadId: params.leadId,
      salesUserId: params.userId,
      salesUserName: params.userName,
      actionType: "initial_contact",
      message: "Initial WhatsApp contact made",
      metadata: { phone: params.phone },
    });
  }

  if (isFirstClick) {
    const activeFollowUp = await getActiveFollowUp(db, params.leadId);
    if (!activeFollowUp) {
      await createFollowUp(db, {
        leadId: params.leadId,
        salesUserId: params.userId,
        salesUserName: params.userName,
        followUpDate: nextDate,
        followUpNumber: (lead.follow_up_count ?? 0) + 1,
        note: "Auto scheduled after WhatsApp click",
      });
      await logActivity(db, {
        leadId: params.leadId,
        salesUserId: params.userId,
        salesUserName: params.userName,
        actionType: "follow_up_scheduled",
        message: "Next follow up scheduled after WhatsApp click",
        metadata: { follow_up_date: nextDate, auto: true },
      });
    }
  }

  return updated;
}

export async function markFollowUpCompleted(
  db: Db,
  params: {
    followUpId: string;
    userId: string;
    userName: string;
    updateLeadStatus?: boolean;
  }
) {
  const { data: fu, error } = await db
    .from("follow_ups")
    .select("*, lead:lead_id(id, owner_user_id, status, follow_up_count)")
    .eq("id", params.followUpId)
    .single();
  if (error || !fu) throw new Error("Follow up not found");

  const lead = fu.lead as { id: string; owner_user_id: string; status: string; follow_up_count: number };
  const now = new Date().toISOString();

  await db
    .from("follow_ups")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", params.followUpId);

  await db
    .from("leads")
    .update({
      follow_up_status: "completed",
      updated_at: now,
      ...(params.updateLeadStatus ? { status: "Follow Up" } : {}),
    })
    .eq("id", lead.id);

  await logActivity(db, {
    leadId: lead.id,
    salesUserId: params.userId,
    salesUserName: params.userName,
    actionType: "follow_up_completed",
    message: "Follow up marked as completed",
    metadata: { follow_up_id: params.followUpId, follow_up_number: fu.follow_up_number },
    oldStatus: lead.status,
    newStatus: "Follow Up",
  });
}

export async function scheduleNextFollowUp(
  db: Db,
  params: {
    leadId: string;
    userId: string;
    userName: string;
    followUpDate: string;
    note?: string | null;
  }
) {
  const { data: lead, error } = await db
    .from("leads")
    .select("id, follow_up_count, status, owner_user_id")
    .eq("id", params.leadId)
    .single();
  if (error || !lead) throw new Error("Lead not found");

  const nextNumber = (lead.follow_up_count ?? 0) + 1;
  const now = new Date().toISOString();

  const row = await createFollowUp(db, {
    leadId: params.leadId,
    salesUserId: params.userId,
    salesUserName: params.userName,
    followUpDate: params.followUpDate,
    followUpNumber: nextNumber,
    note: params.note,
  });

  await db
    .from("leads")
    .update({
      next_follow_up_date: params.followUpDate,
      follow_up_status: "pending",
      follow_up_notes: params.note ?? null,
      updated_at: now,
    })
    .eq("id", params.leadId);

  await logActivity(db, {
    leadId: params.leadId,
    salesUserId: params.userId,
    salesUserName: params.userName,
    actionType: "follow_up_scheduled",
    message: "Next follow up scheduled",
    metadata: { follow_up_date: params.followUpDate, follow_up_number: nextNumber },
  });

  return row;
}

export async function followUpViaWhatsApp(
  db: Db,
  params: {
    followUpId: string;
    userId: string;
    userName: string;
    phone: string;
  }
) {
  const { data: fu, error } = await db
    .from("follow_ups")
    .select("*, lead:lead_id(id, owner_user_id, status, whatsapp_click_count, follow_up_count)")
    .eq("id", params.followUpId)
    .single();
  if (error || !fu) throw new Error("Follow up not found");

  const lead = fu.lead as {
    id: string;
    owner_user_id: string;
    status: string;
    whatsapp_click_count: number;
    follow_up_count: number;
  };

  const now = new Date().toISOString();
  const newFollowCount = (lead.follow_up_count ?? 0) + 1;
  const newClickCount = (lead.whatsapp_click_count ?? 0) + 1;

  await db
    .from("follow_ups")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", params.followUpId);

  await db
    .from("leads")
    .update({
      follow_up_count: newFollowCount,
      whatsapp_click_count: newClickCount,
      last_followed_up_at: now,
      last_contacted_at: now,
      status: lead.status === "Pending" ? "Clicked" : lead.status,
      updated_at: now,
    })
    .eq("id", lead.id);

  await logActivity(db, {
    leadId: lead.id,
    salesUserId: params.userId,
    salesUserName: params.userName,
    actionType: "follow_up_clicked",
    message: "Follow up via WhatsApp clicked",
    metadata: {
      phone: params.phone,
      follow_up_id: params.followUpId,
      follow_up_number: fu.follow_up_number,
    },
    oldStatus: lead.status,
    newStatus: "Clicked",
  });

  return { leadId: lead.id, followUpNumber: fu.follow_up_number };
}

export async function updateOverdueFollowUps(db: Db) {
  const today = toDateString();
  const { data: overdueRows, error } = await db
    .from("follow_ups")
    .select("id, lead_id, sales_user_id, sales_user_name, follow_up_number, follow_up_date, overdue_logged_at")
    .eq("status", "pending")
    .lt("follow_up_date", today);

  if (error) throw new Error(error.message);
  if (!overdueRows?.length) return { updated: 0 };

  const ids = overdueRows.map((r) => r.id);
  await db.from("follow_ups").update({ status: "overdue", updated_at: new Date().toISOString() }).in("id", ids);

  const leadIds = [...new Set(overdueRows.map((r) => r.lead_id))];
  await db
    .from("leads")
    .update({ follow_up_status: "overdue", updated_at: new Date().toISOString() })
    .in("id", leadIds);

  let logged = 0;
  for (const row of overdueRows) {
    if (row.overdue_logged_at) continue;
    await logActivity(db, {
      leadId: row.lead_id,
      salesUserId: row.sales_user_id ?? "",
      salesUserName: row.sales_user_name ?? "System",
      actionType: "follow_up_overdue",
      message: "Follow up is overdue",
      metadata: { follow_up_id: row.id, follow_up_date: row.follow_up_date },
    });
    await db
      .from("follow_ups")
      .update({ overdue_logged_at: new Date().toISOString() })
      .eq("id", row.id);
    logged++;
  }

  return { updated: overdueRows.length, logged };
}

const FOLLOW_UP_SELECT = `
  *,
  lead:lead_id (
    id, name, whatsapp, campaign_name, owner_user_id,
    assigned_sales_user_name, last_contacted_at, last_followed_up_at,
    whatsapp_click_count, follow_up_count, follow_up_status,
    next_follow_up_date, follow_up_notes, clicked_at, updated_at
  )
`;

export async function getFollowUps(
  db: Db,
  opts: {
    role: "admin" | "sales";
    userId?: string;
    filter: FollowUpFilterTab;
    customDate?: string;
    salesUserFilter?: string;
    sort: FollowUpSortKey;
  }
): Promise<FollowUpRow[]> {
  const today = toDateString();
  const yesterday = addDays(new Date(), -1);
  const tomorrowStr = addDays(new Date(), 1);
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return toDateString(d);
  })();
  const weekEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 6);
    return toDateString(d);
  })();

  let query = db.from("follow_ups").select(FOLLOW_UP_SELECT);

  if (opts.role === "sales" && opts.userId) {
    query = query.eq("sales_user_id", opts.userId);
  } else if (opts.role === "admin" && opts.salesUserFilter && opts.salesUserFilter !== "all") {
    query = query.eq("sales_user_id", opts.salesUserFilter);
  }

  switch (opts.filter) {
    case "today":
      query = query.eq("follow_up_date", today).in("status", ["pending", "overdue"]);
      break;
    case "tomorrow":
      query = query.eq("follow_up_date", tomorrowStr).eq("status", "pending");
      break;
    case "yesterday":
      query = query.eq("follow_up_date", yesterday);
      break;
    case "week":
      query = query.gte("follow_up_date", weekStart).lte("follow_up_date", weekEnd);
      break;
    case "custom":
      if (opts.customDate) {
        query = query.eq("follow_up_date", opts.customDate);
      }
      break;
    case "all":
    default:
      break;
  }

  const { data, error } = await query.limit(500);
  if (error) throw new Error(error.message);

  const rows = [...((data ?? []) as FollowUpRow[])].sort((a, b) => {
    switch (opts.sort) {
      case "last_followed_up": {
        const ta = a.lead?.last_followed_up_at ?? "";
        const tb = b.lead?.last_followed_up_at ?? "";
        return tb.localeCompare(ta);
      }
      case "latest_activity": {
        const ta = a.lead?.last_contacted_at ?? a.updated_at ?? "";
        const tb = b.lead?.last_contacted_at ?? b.updated_at ?? "";
        return tb.localeCompare(ta);
      }
      case "oldest_follow_up":
        return b.follow_up_date.localeCompare(a.follow_up_date);
      case "follow_up_date":
      default:
        return a.follow_up_date.localeCompare(b.follow_up_date);
    }
  });

  return rows;
}


export async function getFollowUpKpis(
  db: Db,
  opts: { role: "admin" | "sales"; userId?: string }
): Promise<FollowUpKpiStats> {
  const today = toDateString();
  let base = db.from("follow_ups").select("id, status, follow_up_date, sales_user_id", { count: "exact" });

  if (opts.role === "sales" && opts.userId) {
    base = base.eq("sales_user_id", opts.userId);
  }

  const { data, error } = await base.limit(5000);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    today: rows.filter((r) => r.follow_up_date === today && r.status === "pending").length,
    overdue: rows.filter(
      (r) => r.follow_up_date < today && (r.status === "pending" || r.status === "overdue")
    ).length,
    completed: rows.filter((r) => r.status === "completed").length,
    total: rows.length,
  };
}

export async function getLeadHistory(db: Db, leadId: string) {
  const [activities, followUps] = await Promise.all([
    db
      .from("activity_logs")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("follow_up_number", { ascending: false }),
  ]);

  return {
    activities: activities.data ?? [],
    followUps: followUps.data ?? [],
  };
}
