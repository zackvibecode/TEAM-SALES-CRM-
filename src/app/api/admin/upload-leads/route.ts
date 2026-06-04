import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createDbClient } from "@/lib/supabase/server";
import { dateCreatedToISO } from "@/lib/lead-date-created";
import { parseLeadRows } from "@/lib/parse-leads";
import { formatWhatsAppNumber } from "@/lib/whatsapp";
import { logAudit } from "@/lib/audit";

type ParsedLead = ReturnType<typeof parseLeadRows>[number];

async function validateSalesOwner(db: ReturnType<typeof createDbClient>, ownerId: string) {
  const { data, error } = await db
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", ownerId)
    .single();

  if (error || !data) {
    return { ok: false as const, error: "Selected sales user not found in database." };
  }
  if (data.role !== "sales") {
    return { ok: false as const, error: `${data.email} is not a sales account (role: ${data.role}).` };
  }
  return { ok: true as const, profile: data };
}

async function insertBatchForOwner(
  db: ReturnType<typeof createDbClient>,
  params: {
    leads: ParsedLead[];
    fileName: string;
    campaignName: string;
    sourceTag: string;
    ownerUserId: string;
    uploadedByAdminId: string;
    reassignExisting: boolean;
  }
) {
  const baseRow = {
    file_name: params.fileName,
    uploaded_by_admin_id: params.uploadedByAdminId,
    owner_user_id: params.ownerUserId,
    total_rows: 0,
  };
  const extendedRow = {
    ...baseRow,
    campaign_name: params.campaignName,
    source_tag: params.sourceTag,
  };

  let uploadedFile: { id: string };
  const first = await db.from("uploaded_files").insert(extendedRow).select().single();
  if (first.error) {
    const fallback = await db.from("uploaded_files").insert(baseRow).select().single();
    if (fallback.error) throw new Error(fallback.error.message);
    uploadedFile = fallback.data!;
  } else {
    uploadedFile = first.data!;
  }

  const { data: existingLeads } = await db
    .from("leads")
    .select("id, whatsapp, owner_user_id");

  const byWa = new Map<string, { id: string; owner_user_id: string }>();
  for (const row of existingLeads || []) {
    if (row.whatsapp) {
      byWa.set(formatWhatsAppNumber(row.whatsapp), {
        id: row.id,
        owner_user_id: row.owner_user_id,
      });
    }
  }

  const toInsert: ParsedLead[] = [];
  let skippedSameOwner = 0;
  let reassigned = 0;
  const fileDupes = new Set<string>();
  const now = new Date().toISOString();

  for (const l of params.leads) {
    const wa = formatWhatsAppNumber(l.whatsapp);
    if (fileDupes.has(wa)) {
      skippedSameOwner++;
      continue;
    }
    fileDupes.add(wa);

    const existing = byWa.get(wa);
    if (existing) {
      if (existing.owner_user_id === params.ownerUserId) {
        skippedSameOwner++;
        continue;
      }
      if (params.reassignExisting) {
        await db
          .from("leads")
          .update({
            owner_user_id: params.ownerUserId,
            source_file_id: uploadedFile.id,
            status: "Pending",
            name: l.name,
            package_interest: l.package_interest,
            notes: l.notes,
            updated_at: now,
          })
          .eq("id", existing.id);
        reassigned++;
      } else {
        skippedSameOwner++;
      }
      continue;
    }

    toInsert.push(l);
    byWa.set(wa, { id: "pending", owner_user_id: params.ownerUserId });
  }

  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize).map((l) => {
      const excelCreatedAt = l.date_created
        ? dateCreatedToISO(l.date_created)
        : null;
      return {
        source_file_id: uploadedFile.id,
        owner_user_id: params.ownerUserId,
        name: l.name,
        whatsapp: formatWhatsAppNumber(l.whatsapp),
        package_interest: l.package_interest,
        notes: l.notes,
        status: "Pending",
        ...(excelCreatedAt ? { created_at: excelCreatedAt } : {}),
      };
    });

    const { error: insertError } = await db.from("leads").insert(batch);
    if (insertError) throw new Error(insertError.message);
    inserted += batch.length;
  }

  const totalAssigned = inserted + reassigned;
  await db
    .from("uploaded_files")
    .update({ total_rows: totalAssigned })
    .eq("id", uploadedFile.id);

  return {
    fileId: uploadedFile.id,
    inserted,
    reassigned,
    skippedSameOwner,
    rowCount: totalAssigned,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      leads,
      fileName,
      ownerUserId,
      ownerUserIds,
      assignMode = "single",
      campaignName,
      sourceTag = "",
      reassignExisting = true,
    } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads data" }, { status: 400 });
    }

    const uploadedByAdminId = auth.user.id;
    const db = auth.db;
    const normalized = parseLeadRows(leads as Record<string, unknown>[]);

    if (normalized.length === 0) {
      const sampleKeys =
        leads.length > 0 ? Object.keys(leads[0] as Record<string, unknown>) : [];
      return NextResponse.json(
        {
          error:
            'Could not find valid WhatsApp numbers. Use columns like "WhatsApp Number", "Phone", or "Mobile".',
          detectedColumns: sampleKeys,
        },
        { status: 400 }
      );
    }

    const campaign = (campaignName || fileName || "Campaign").trim();
    const source = String(sourceTag || "").trim();

    const targetOwners: string[] =
      assignMode === "round_robin" && Array.isArray(ownerUserIds) && ownerUserIds.length > 0
        ? ownerUserIds
        : ownerUserId
          ? [ownerUserId]
          : [];

    if (targetOwners.length === 0) {
      return NextResponse.json({ error: "No sales user selected" }, { status: 400 });
    }

    for (const oid of targetOwners) {
      const check = await validateSalesOwner(db, oid);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    const assignments: {
      ownerId: string;
      ownerEmail: string;
      ownerName: string;
      fileId: string;
      rows: number;
      inserted: number;
      reassigned: number;
      skipped: number;
    }[] = [];

    if (assignMode === "round_robin" && targetOwners.length > 1) {
      const buckets: ParsedLead[][] = targetOwners.map(() => []);
      normalized.forEach((lead, i) => {
        buckets[i % targetOwners.length].push(lead);
      });

      for (let i = 0; i < targetOwners.length; i++) {
        if (buckets[i].length === 0) continue;
        const owner = targetOwners[i];
        const check = await validateSalesOwner(db, owner);
        if (!check.ok) continue;
        const suffix = check.profile.full_name ? ` — ${check.profile.full_name}` : "";
        const result = await insertBatchForOwner(db, {
          leads: buckets[i],
          fileName: `${fileName || "upload"}${suffix}`,
          campaignName: campaign,
          sourceTag: source,
          ownerUserId: owner,
          uploadedByAdminId,
          reassignExisting,
        });
        assignments.push({
          ownerId: owner,
          ownerEmail: check.profile.email,
          ownerName: check.profile.full_name,
          fileId: result.fileId,
          rows: result.rowCount,
          inserted: result.inserted,
          reassigned: result.reassigned,
          skipped: result.skippedSameOwner,
        });
      }
    } else {
      const owner = targetOwners[0];
      const check = await validateSalesOwner(db, owner);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      const result = await insertBatchForOwner(db, {
        leads: normalized,
        fileName: fileName || "manual_upload.xlsx",
        campaignName: campaign,
        sourceTag: source,
        ownerUserId: owner,
        uploadedByAdminId,
        reassignExisting,
      });

      if (result.rowCount === 0) {
        return NextResponse.json(
          {
            error: `No new leads assigned to ${check.profile.full_name} (${check.profile.email}). All ${result.skippedSameOwner} numbers already belong to this user.`,
            duplicate_count: result.skippedSameOwner,
          },
          { status: 400 }
        );
      }

      assignments.push({
        ownerId: owner,
        ownerEmail: check.profile.email,
        ownerName: check.profile.full_name,
        fileId: result.fileId,
        rows: result.rowCount,
        inserted: result.inserted,
        reassigned: result.reassigned,
        skipped: result.skippedSameOwner,
      });
    }

    const totalRows = assignments.reduce((s, a) => s + a.rows, 0);
    if (totalRows === 0) {
      return NextResponse.json({ error: "No leads were assigned. Check WhatsApp column data." }, { status: 400 });
    }

    const skipped = leads.length - normalized.length;

    await logAudit({
      actorId: uploadedByAdminId,
      action: "upload_leads",
      entityType: "uploaded_files",
      details: { campaign, source, assignMode, totalRows, assignments },
    });

    return NextResponse.json({
      success: true,
      total_rows: totalRows,
      skipped_rows: skipped > 0 ? skipped : undefined,
      assignments,
      campaign_name: campaign,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
