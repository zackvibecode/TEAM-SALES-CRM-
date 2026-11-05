import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import {
  importSalesLeadsForPic,
  importSalesLeadsRoundRobin,
  getPics,
} from "@/lib/sales-follow-up/service";
import { parseLeadRows, detectPackageColumn } from "@/lib/parse-leads";
import { readSpreadsheetRows } from "@/lib/read-spreadsheet";
import { SF_ERROR, sfError } from "@/lib/sales-follow-up/errors";

export async function POST(request: NextRequest) {
  const ctx = await getAuthenticatedContext();
  if (!ctx) {
    const e = sfError(SF_ERROR.UNAUTHORIZED, 401);
    return NextResponse.json(e.body, { status: e.status });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const requestedPicId = String(form.get("picId") || "").trim() || null;
    const assignMode = form.get("assignMode") === "round_robin" ? "round_robin" : "single";
    const batchName = String(form.get("batchName") || "").trim();

    // Who performed this upload (PIC name for sales, label for admin uploads)
    let uploaderName = "Admin";
    if (ctx.role !== "admin") {
      const scoped = await resolveScopedPicId(ctx.db, ctx.role, ctx.user.id, null);
      uploaderName = scoped.pic?.name || ctx.user.email || "Sales";
    }
    if (assignMode === "round_robin" && ctx.role !== "admin") {
      const e = sfError(SF_ERROR.UNAUTHORIZED, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

    if (!(file instanceof File)) {
      const e = sfError(SF_ERROR.UPLOAD_FILE_REQUIRED, 400);
      return NextResponse.json(e.body, { status: e.status });
    }

    const nameLower = file.name.toLowerCase();
    if (!/\.(xlsx|xls|csv)$/.test(nameLower)) {
      const e = sfError(SF_ERROR.UPLOAD_FORMAT, 400);
      return NextResponse.json(e.body, { status: e.status });
    }

    const scoped = await resolveScopedPicId(
      ctx.db,
      ctx.role,
      ctx.user.id,
      requestedPicId
    );
    if (scoped.error) {
      const e = sfError(SF_ERROR.PIC_NOT_LINKED, 403);
      return NextResponse.json(e.body, { status: e.status });
    }

    let assignedPicId = scoped.picId;
    if (ctx.role === "admin" && assignMode === "single") {
      if (!requestedPicId) {
        const e = sfError(SF_ERROR.UPLOAD_PIC_REQUIRED, 400);
        return NextResponse.json(e.body, { status: e.status });
      }
      const pics = await getPics(ctx.db);
      if (!pics.some((p) => p.id === requestedPicId)) {
        const e = sfError(SF_ERROR.UPLOAD_PIC_NOT_FOUND, 400);
        return NextResponse.json(e.body, { status: e.status });
      }
      assignedPicId = requestedPicId;
    }

    if (!assignedPicId && assignMode === "single") {
      const e = sfError(SF_ERROR.UPLOAD_PIC_UNRESOLVED, 400);
      return NextResponse.json(e.body, { status: e.status });
    }

    const buffer = await file.arrayBuffer();
    const sheetRows = readSpreadsheetRows(buffer);
    const sampleKeys =
      sheetRows.length > 0 ? Object.keys(sheetRows[0] as Record<string, unknown>) : [];
    const packageColumnDetected = Boolean(detectPackageColumn(sampleKeys));
    const parsed = parseLeadRows(sheetRows);

    if (parsed.length === 0) {
      const e = sfError(SF_ERROR.UPLOAD_NO_PHONES, 400);
      return NextResponse.json({ ...e.body, detectedColumns: sampleKeys }, { status: e.status });
    }

    const source = `Excel Upload: ${file.name}`.slice(0, 120);
    const result =
      assignMode === "round_robin"
        ? await importSalesLeadsRoundRobin(ctx.db, { rows: parsed, source })
        : await importSalesLeadsForPic(ctx.db, {
            rows: parsed,
            assignedPicId: assignedPicId!,
            source,
          });

    // Record this upload as a batch and link the newly inserted leads to it
    let batchId: string | undefined;
    if (result.insertedLeadIds.length > 0) {
      // uploaded_by_user_id hanya jika kolum wujud (migration 023 mungkin belum dijalankan)
      const { error: probeErr } = await ctx.db
        .from("sales_lead_batches")
        .select("uploaded_by_user_id")
        .limit(1);
      const hasOwnerCol = !probeErr;
      const { data: batchRow, error: batchErr } = await ctx.db
        .from("sales_lead_batches")
        .insert(
          hasOwnerCol
            ? {
                batch_name: batchName || file.name,
                file_name: file.name,
                total_leads: result.insertedLeadIds.length,
                assign_mode: assignMode,
                uploaded_by: uploaderName,
                uploaded_by_user_id: ctx.user.id,
              }
            : {
                batch_name: batchName || file.name,
                file_name: file.name,
                total_leads: result.insertedLeadIds.length,
                assign_mode: assignMode,
                uploaded_by: uploaderName,
              }
        )
        .select("id")
        .single();
      if (batchErr) throw new Error(`Failed to record upload batch: ${batchErr.message}`);
      batchId = batchRow!.id;

      for (let i = 0; i < result.insertedLeadIds.length; i += 200) {
        const chunk = result.insertedLeadIds.slice(i, i + 200);
        const { error: linkErr } = await ctx.db
          .from("sales_leads")
          .update({ batch_id: batchId })
          .in("id", chunk);
        if (linkErr) throw new Error(`Failed to link leads to batch: ${linkErr.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      batchName: batchName || file.name,
      batchId,
      assignMode,
      assignedPicId: assignMode === "single" ? assignedPicId : undefined,
      packageColumnDetected,
      detectedColumns: sampleKeys,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const e = sfError(SF_ERROR.UPLOAD_FAILED, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
