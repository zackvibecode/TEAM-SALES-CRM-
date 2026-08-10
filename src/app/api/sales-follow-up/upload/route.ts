import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth-context";
import { resolveScopedPicId } from "@/lib/sales-follow-up/access";
import { importSalesLeadsForPic, getPics } from "@/lib/sales-follow-up/service";
import { parseLeadRows } from "@/lib/parse-leads";
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
    if (ctx.role === "admin") {
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

    if (!assignedPicId) {
      const e = sfError(SF_ERROR.UPLOAD_PIC_UNRESOLVED, 400);
      return NextResponse.json(e.body, { status: e.status });
    }

    const buffer = await file.arrayBuffer();
    const sheetRows = readSpreadsheetRows(buffer);
    const parsed = parseLeadRows(sheetRows);

    if (parsed.length === 0) {
      const sampleKeys =
        sheetRows.length > 0 ? Object.keys(sheetRows[0] as Record<string, unknown>) : [];
      const e = sfError(SF_ERROR.UPLOAD_NO_PHONES, 400);
      return NextResponse.json({ ...e.body, detectedColumns: sampleKeys }, { status: e.status });
    }

    const source = `Excel Upload: ${file.name}`.slice(0, 120);
    const result = await importSalesLeadsForPic(ctx.db, {
      rows: parsed,
      assignedPicId,
      source,
    });

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      assignedPicId,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const e = sfError(SF_ERROR.UPLOAD_FAILED, 500, message);
    return NextResponse.json(e.body, { status: e.status });
  }
}
