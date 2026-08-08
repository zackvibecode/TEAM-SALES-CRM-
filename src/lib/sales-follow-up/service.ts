import { createDbClient } from "@/lib/supabase/server";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import type {
  SalesPic,
  SalesLead,
  SalesLeadWithLastFollowUp,
  LeadFollowUp,
  DashboardStats,
  PicPerformanceRow,
  ChartDataPoint,
  FollowUpFilterParams,
  CreateLeadInput,
  UpdateLeadInput,
  CreateFollowUpInput,
  LeadStatus,
} from "./types";
import { todayKL } from "./dates";

type DbClient = ReturnType<typeof createDbClient>;

// ===================================================
// PIC SERVICE
// ===================================================

export async function getPics(db: DbClient): Promise<SalesPic[]> {
  const { data, error } = await db
    .from("sales_pics")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to fetch PICs: ${error.message}`);
  return data ?? [];
}

export async function getAllPics(db: DbClient): Promise<SalesPic[]> {
  const { data, error } = await db
    .from("sales_pics")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to fetch PICs: ${error.message}`);
  return data ?? [];
}

// ===================================================
// LEAD SERVICE
// ===================================================

type LeadFilterQuery = {
  gte: (column: string, value: string | number) => LeadFilterQuery;
  lte: (column: string, value: string | number) => LeadFilterQuery;
  eq: (column: string, value: string | number) => LeadFilterQuery;
  or: (filters: string) => LeadFilterQuery;
  lt: (column: string, value: string | number) => LeadFilterQuery;
  not: (column: string, operator: string, value: unknown) => LeadFilterQuery;
};

function buildLeadFilters(
  query: LeadFilterQuery,
  filters: FollowUpFilterParams
): LeadFilterQuery {
  let q = query;

  if (filters.startDate) {
    q = q.gte("created_at", `${filters.startDate}T00:00:00`);
  }
  if (filters.endDate) {
    q = q.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
  }
  if (filters.picId) {
    q = q.eq("assigned_pic_id", filters.picId);
  }
  if (filters.status) {
    q = q.eq("lead_status", filters.status);
  }
  if (filters.search) {
    q = q.or(
      `customer_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,normalized_phone_number.ilike.%${filters.search}%`
    );
  }

  if (filters.followUpFilter === "0") {
    q = q.eq("total_follow_ups", 0);
  } else if (filters.followUpFilter === "1") {
    q = q.eq("total_follow_ups", 1);
  } else if (filters.followUpFilter === "2") {
    q = q.eq("total_follow_ups", 2);
  } else if (filters.followUpFilter === "3+") {
    q = q.gte("total_follow_ups", 3);
  } else if (filters.followUpFilter === "overdue") {
    const today = todayKL();
    q = q.lt("next_follow_up_date", today)
      .not("lead_status", "in", '("Booked","Closed")')
      .not("next_follow_up_date", "is", null);
  }

  return q;
}

export async function getLeads(
  db: DbClient,
  filters: FollowUpFilterParams
): Promise<SalesLeadWithLastFollowUp[]> {
  // Use untyped query builder to avoid PostgREST deep instantiation in CI.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = db.from("sales_leads").select("*, assigned_pic:assigned_pic_id(*)");
  query = buildLeadFilters(query, filters);
  query = query.order("created_at", { ascending: false }).limit(1000);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch leads: ${error.message}`);

  const leads = (data ?? []) as SalesLead[];
  const leadIds = leads.map((l) => l.id);

  const lastFollowUpByLead = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: followUps } = await db
      .from("lead_follow_ups")
      .select("lead_id, follow_up_date")
      .in("lead_id", leadIds)
      .order("follow_up_date", { ascending: false });

    for (const row of (followUps ?? []) as Array<{ lead_id: string; follow_up_date: string }>) {
      if (!lastFollowUpByLead.has(row.lead_id)) {
        lastFollowUpByLead.set(row.lead_id, row.follow_up_date);
      }
    }
  }

  return leads.map((lead) => ({
    ...lead,
    last_follow_up_date: lastFollowUpByLead.get(lead.id) ?? null,
  }));
}

export async function getLeadById(
  db: DbClient,
  leadId: string
): Promise<SalesLead | null> {
  const { data, error } = await db
    .from("sales_leads")
    .select(`*, assigned_pic:assigned_pic_id(*)`)
    .eq("id", leadId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch lead: ${error.message}`);
  }
  return data as SalesLead;
}

export async function checkDuplicatePhone(
  db: DbClient,
  phoneNumber: string,
  excludeLeadId?: string
): Promise<boolean> {
  const normalized = formatWhatsAppNumber(phoneNumber);
  let query = db
    .from("sales_leads")
    .select("id")
    .eq("normalized_phone_number", normalized);

  if (excludeLeadId) {
    query = query.neq("id", excludeLeadId);
  }

  const { data, error } = await query;
  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("Could not find the table")
    ) {
      throw new Error(
        "Database belum siap. Jalankan SQL fix-live.sql dalam Supabase project yang sama dengan live web, kemudian NOTIFY pgrst, 'reload schema'."
      );
    }
    throw new Error(`Failed to check duplicate: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}

export async function createLead(
  db: DbClient,
  input: CreateLeadInput
): Promise<SalesLead> {
  const normalized = formatWhatsAppNumber(input.phone_number);

  const { data, error } = await db
    .from("sales_leads")
    .insert({
      customer_name: input.customer_name || "",
      phone_number: input.phone_number,
      normalized_phone_number: normalized,
      destination_or_product: input.destination_or_product || "",
      source: input.source || "",
      assigned_pic_id: input.assigned_pic_id || null,
      lead_status: input.lead_status || "New",
      next_follow_up_date: input.next_follow_up_date || null,
      latest_response: "",
      total_follow_ups: 0,
    })
    .select(`*, assigned_pic:assigned_pic_id(*)`)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Nombor telefon ini sudah berada dalam database.");
    }
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  if (input.notes && input.notes.trim()) {
    await createFollowUp(db, {
      lead_id: data.id,
      pic_id: input.assigned_pic_id,
      follow_up_date: input.next_follow_up_date || todayKL(),
      notes: input.notes,
      status: "No Response",
    });
  }

  return data as SalesLead;
}

export async function updateLead(
  db: DbClient,
  leadId: string,
  input: UpdateLeadInput
): Promise<SalesLead> {
  const updateData: Record<string, unknown> = {};

  if (input.customer_name !== undefined) updateData.customer_name = input.customer_name;
  if (input.destination_or_product !== undefined) updateData.destination_or_product = input.destination_or_product;
  if (input.source !== undefined) updateData.source = input.source;
  if (input.assigned_pic_id !== undefined) updateData.assigned_pic_id = input.assigned_pic_id;
  if (input.lead_status !== undefined) updateData.lead_status = input.lead_status;
  if (input.next_follow_up_date !== undefined) updateData.next_follow_up_date = input.next_follow_up_date;

  if (input.phone_number) {
    const normalized = formatWhatsAppNumber(input.phone_number);
    updateData.phone_number = input.phone_number;
    updateData.normalized_phone_number = normalized;
  }

  const { data, error } = await db
    .from("sales_leads")
    .update(updateData)
    .eq("id", leadId)
    .select(`*, assigned_pic:assigned_pic_id(*)`)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Nombor telefon ini sudah berada dalam database.");
    }
    throw new Error(`Failed to update lead: ${error.message}`);
  }

  return data as SalesLead;
}

export async function deleteLead(db: DbClient, leadId: string): Promise<void> {
  const { error } = await db.from("sales_leads").delete().eq("id", leadId);
  if (error) throw new Error(`Failed to delete lead: ${error.message}`);
}

// ===================================================
// FOLLOW-UP SERVICE
// ===================================================

export async function getLeadFollowUps(
  db: DbClient,
  leadId: string
): Promise<LeadFollowUp[]> {
  const { data, error } = await db
    .from("lead_follow_ups")
    .select(`*, pic:pic_id(*)`)
    .eq("lead_id", leadId)
    .order("follow_up_number", { ascending: true });

  if (error) throw new Error(`Failed to fetch follow-ups: ${error.message}`);
  return (data ?? []) as LeadFollowUp[];
}

export async function createFollowUp(
  db: DbClient,
  input: CreateFollowUpInput
): Promise<LeadFollowUp> {
  const lead = await getLeadById(db, input.lead_id);
  if (!lead) throw new Error("Lead tidak dijumpai.");

  const nextFollowUpNumber = lead.total_follow_ups + 1;

  const { data, error } = await db
    .from("lead_follow_ups")
    .insert({
      lead_id: input.lead_id,
      pic_id: input.pic_id || lead.assigned_pic_id,
      follow_up_number: nextFollowUpNumber,
      follow_up_date: input.follow_up_date,
      response: input.response || "",
      status: input.status || "No Response",
      notes: input.notes || "",
      next_follow_up_date: input.next_follow_up_date || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create follow-up: ${error.message}`);

  const followUp = data as LeadFollowUp;

  await db
    .from("sales_leads")
    .update({
      total_follow_ups: nextFollowUpNumber,
      latest_response: input.response || input.status || lead.latest_response,
      lead_status: input.status && input.status !== "No Response"
        ? mapFollowUpStatusToLeadStatus(input.status)
        : lead.lead_status,
      next_follow_up_date: input.next_follow_up_date || lead.next_follow_up_date,
    })
    .eq("id", input.lead_id);

  return followUp;
}

export async function deleteFollowUp(
  db: DbClient,
  followUpId: string
): Promise<void> {
  const { data: followUp, error: fetchError } = await db
    .from("lead_follow_ups")
    .select("lead_id")
    .eq("id", followUpId)
    .single();

  if (fetchError) throw new Error(`Failed to find follow-up: ${fetchError.message}`);

  const { error } = await db
    .from("lead_follow_ups")
    .delete()
    .eq("id", followUpId);

  if (error) throw new Error(`Failed to delete follow-up: ${error.message}`);

  await recalculateLeadFollowUpCount(db, (followUp as { lead_id: string }).lead_id);
}

async function recalculateLeadFollowUpCount(db: DbClient, leadId: string): Promise<void> {
  const { count, error } = await db
    .from("lead_follow_ups")
    .select("*", { count: "exact", head: true })
    .eq("lead_id", leadId);

  if (error) throw new Error(`Failed to count follow-ups: ${error.message}`);

  const { data: lastFU } = await db
    .from("lead_follow_ups")
    .select("follow_up_date, status")
    .eq("lead_id", leadId)
    .order("follow_up_number", { ascending: false })
    .limit(1);

  await db
    .from("sales_leads")
    .update({
      total_follow_ups: count ?? 0,
      latest_response: lastFU?.[0]?.status || "",
    })
    .eq("id", leadId);
}

function mapFollowUpStatusToLeadStatus(fuStatus: string): LeadStatus {
  const map: Record<string, LeadStatus> = {
    "No Response": "No Response",
    "Replied": "Follow-Up",
    "Interested": "Interested",
    "KIV": "KIV",
    "Not Interested": "Not Interested",
    "Booked": "Booked",
    "Need Follow-Up": "Follow-Up",
    "Wrong Number": "Closed",
  };
  return map[fuStatus] || "Follow-Up";
}

// ===================================================
// DASHBOARD / ANALYTICS SERVICE
// ===================================================

export async function getDashboardStats(
  db: DbClient,
  filters: FollowUpFilterParams
): Promise<DashboardStats> {
  const today = todayKL();

  let leadQuery = db.from("sales_leads").select("id, lead_status, total_follow_ups, next_follow_up_date, created_at, assigned_pic_id", { count: "exact" });
  let fuQuery = db.from("lead_follow_ups").select("id, follow_up_date", { count: "exact" });

  if (filters.startDate) {
    leadQuery = leadQuery.gte("created_at", `${filters.startDate}T00:00:00`);
  }
  if (filters.endDate) {
    leadQuery = leadQuery.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
  }
  if (filters.picId) {
    leadQuery = leadQuery.eq("assigned_pic_id", filters.picId);
  }
  if (filters.status) {
    leadQuery = leadQuery.eq("lead_status", filters.status);
  }

  const { data: leads, error: leadError } = await leadQuery;
  if (leadError) throw new Error(`Failed to fetch leads: ${leadError.message}`);

  const leadData = (leads ?? []) as Array<{
    id: string;
    lead_status: string;
    total_follow_ups: number;
    next_follow_up_date: string | null;
    assigned_pic_id: string | null;
  }>;

  let fuCount = 0;
  if (filters.picId) {
    const leadIds = leadData.map((l) => l.id);
    if (leadIds.length > 0) {
      fuQuery = fuQuery.in("lead_id", leadIds);
    }
  }
  if (filters.startDate) {
    fuQuery = fuQuery.gte("follow_up_date", filters.startDate);
  }
  if (filters.endDate) {
    fuQuery = fuQuery.lte("follow_up_date", filters.endDate);
  }

  const { count: fuTotal, error: fuError } = await fuQuery;
  if (fuError) throw new Error(`Failed to count follow-ups: ${fuError.message}`);
  fuCount = fuTotal ?? 0;

  const totalLeads = leadData.length;
  const followedUpOnce = leadData.filter((l) => l.total_follow_ups >= 1).length;
  const followedUpThree = leadData.filter((l) => l.total_follow_ups >= 3).length;
  const noFollowUp = leadData.filter((l) => l.total_follow_ups === 0).length;
  const overdue = leadData.filter(
    (l) =>
      l.next_follow_up_date &&
      l.next_follow_up_date < today &&
      l.lead_status !== "Booked" &&
      l.lead_status !== "Closed"
  ).length;

  return {
    total_leads: totalLeads,
    total_follow_ups: fuCount,
    followed_up_once: followedUpOnce,
    followed_up_three: followedUpThree,
    no_follow_up: noFollowUp,
    overdue,
  };
}

export async function getPicPerformance(
  db: DbClient,
  filters: FollowUpFilterParams
): Promise<PicPerformanceRow[]> {
  const pics = await getPics(db);
  if (pics.length === 0) return [];

  const picIds = pics.map((p) => p.id);
  const picNameMap = new Map(pics.map((p) => [p.id, p.name]));
  const today = todayKL();

  // Bulk fetch ALL leads and follow-ups in 2 queries instead of N+1 per-PIC loop
  let leadQuery = db
    .from("sales_leads")
    .select("id, assigned_pic_id, lead_status, total_follow_ups, next_follow_up_date, created_at")
    .in("assigned_pic_id", picIds);

  let fuQuery = db
    .from("lead_follow_ups")
    .select("id, lead_id, pic_id, follow_up_date")
    .in("pic_id", picIds);

  if (filters.startDate) {
    leadQuery = leadQuery.gte("created_at", `${filters.startDate}T00:00:00`);
    fuQuery = fuQuery.gte("follow_up_date", filters.startDate);
  }
  if (filters.endDate) {
    leadQuery = leadQuery.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
    fuQuery = fuQuery.lte("follow_up_date", filters.endDate);
  }
  if (filters.status) {
    leadQuery = leadQuery.eq("lead_status", filters.status);
  }

  const [{ data: allLeads }, { data: allFollowUps }] = await Promise.all([leadQuery, fuQuery]);

  const leads = (allLeads ?? []) as Array<{
    id: string;
    assigned_pic_id: string;
    lead_status: string;
    total_follow_ups: number;
    next_follow_up_date: string | null;
  }>;
  const followUps = (allFollowUps ?? []) as Array<{
    lead_id: string;
    pic_id: string;
    follow_up_date: string;
  }>;

  // Group by PIC
  const leadsByPic = new Map<string, typeof leads>();
  const fuByPic = new Map<string, number>();
  for (const l of leads) {
    if (!leadsByPic.has(l.assigned_pic_id)) leadsByPic.set(l.assigned_pic_id, []);
    leadsByPic.get(l.assigned_pic_id)!.push(l);
  }
  for (const fu of followUps) {
    fuByPic.set(fu.pic_id, (fuByPic.get(fu.pic_id) ?? 0) + 1);
  }

  const result: PicPerformanceRow[] = [];
  for (const picId of picIds) {
    const picLeads = leadsByPic.get(picId) ?? [];
    const fuCount = fuByPic.get(picId) ?? 0;
    const leadsAssigned = picLeads.length;
    const leadsFollowedUp = picLeads.filter((l) => l.total_follow_ups >= 1).length;
    const leadsWith3Plus = picLeads.filter((l) => l.total_follow_ups >= 3).length;
    const noFollowUp = picLeads.filter((l) => l.total_follow_ups === 0).length;
    const overdue = picLeads.filter(
      (l) =>
        l.next_follow_up_date &&
        l.next_follow_up_date < today &&
        l.lead_status !== "Booked" &&
        l.lead_status !== "Closed"
    ).length;

    result.push({
      pic_id: picId,
      pic_name: picNameMap.get(picId) ?? "Unknown",
      leads_assigned: leadsAssigned,
      total_follow_up_activities: fuCount,
      leads_followed_up: leadsFollowedUp,
      leads_with_three_plus: leadsWith3Plus,
      no_follow_up: noFollowUp,
      overdue,
      completion_rate: leadsAssigned > 0 ? Math.round((leadsWith3Plus / leadsAssigned) * 1000) / 10 : 0,
    });
  }

  result.sort((a, b) => b.total_follow_up_activities - a.total_follow_up_activities);
  return result;
}

export async function getChartData(
  db: DbClient,
  filters: FollowUpFilterParams
): Promise<ChartDataPoint[]> {
  const pics = await getPics(db);
  if (pics.length === 0) return [];

  const picIds = pics.map((p) => p.id);
  const picNameMap = new Map(pics.map((p) => [p.id, p.name]));

  // Bulk fetch ALL leads and follow-ups in 2 queries instead of N+1 per-PIC loop
  let leadQuery = db
    .from("sales_leads")
    .select("id, assigned_pic_id, total_follow_ups, created_at")
    .in("assigned_pic_id", picIds);

  let fuQuery = db
    .from("lead_follow_ups")
    .select("id, lead_id, pic_id, follow_up_date")
    .in("pic_id", picIds);

  if (filters.startDate) {
    leadQuery = leadQuery.gte("created_at", `${filters.startDate}T00:00:00`);
    fuQuery = fuQuery.gte("follow_up_date", filters.startDate);
  }
  if (filters.endDate) {
    leadQuery = leadQuery.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
    fuQuery = fuQuery.lte("follow_up_date", filters.endDate);
  }
  if (filters.status) {
    leadQuery = leadQuery.eq("lead_status", filters.status);
  }

  const [{ data: allLeads }, { data: allFollowUps }] = await Promise.all([leadQuery, fuQuery]);

  const leads = (allLeads ?? []) as Array<{
    id: string;
    assigned_pic_id: string;
    total_follow_ups: number;
  }>;
  const followUps = (allFollowUps ?? []) as Array<{
    lead_id: string;
    pic_id: string;
  }>;

  const leadsByPic = new Map<string, typeof leads>();
  const fuByPic = new Map<string, number>();
  for (const l of leads) {
    if (!leadsByPic.has(l.assigned_pic_id)) leadsByPic.set(l.assigned_pic_id, []);
    leadsByPic.get(l.assigned_pic_id)!.push(l);
  }
  for (const fu of followUps) {
    fuByPic.set(fu.pic_id, (fuByPic.get(fu.pic_id) ?? 0) + 1);
  }

  const result: ChartDataPoint[] = [];
  for (const picId of picIds) {
    const picLeads = leadsByPic.get(picId) ?? [];
    const fuCount = fuByPic.get(picId) ?? 0;

    result.push({
      pic_name: picNameMap.get(picId) ?? "Unknown",
      total_activities: fuCount,
      leads_assigned: picLeads.length,
      leads_followed_up: picLeads.filter((l) => l.total_follow_ups >= 1).length,
      leads_three_plus: picLeads.filter((l) => l.total_follow_ups >= 3).length,
    });
  }

  result.sort((a, b) => b.total_activities - a.total_activities);
  return result;
}

export async function insertSeedPics(db: DbClient): Promise<void> {
  const { data: existing } = await db.from("sales_pics").select("id").limit(1);
  if (existing && existing.length > 0) return;

  const seedNames = ["Fatin", "Alip", "Fadhlin", "Sheima", "Ain"];
  for (const name of seedNames) {
    await db.from("sales_pics").insert({
      name,
      status: "active",
    });
  }
}
