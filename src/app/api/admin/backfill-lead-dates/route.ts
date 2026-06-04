import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  batchUpdateLeadDatesForOwner,
  buildLeadDatePatches,
} from "@/lib/batch-update-lead-dates";
import { debugSessionLog } from "@/lib/debug-log";
import { dateCreatedToISO } from "@/lib/lead-date-created";
import { detectDateCreatedColumn, parseLeadRows } from "@/lib/parse-leads";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { leads, ownerUserId } = body;

    if (!ownerUserId) {
      return NextResponse.json({ error: "ownerUserId is required" }, { status: 400 });
    }
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads data" }, { status: 400 });
    }

    const db = auth.db;
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", ownerUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Sales user not found" }, { status: 400 });
    }
    if (profile.role !== "sales") {
      return NextResponse.json({ error: "Selected user is not a sales account" }, { status: 400 });
    }

    const rawHeaders =
      leads.length > 0 ? Object.keys(leads[0] as Record<string, unknown>) : [];
    const normalized = parseLeadRows(leads as Record<string, unknown>[]);
    const dateColDetected = detectDateCreatedColumn(rawHeaders);
    const parseable = normalized.filter(
      (l) => l.date_created && dateCreatedToISO(l.date_created)
    ).length;
    const sampleYears = [
      ...new Set(
        normalized
          .filter((l) => l.date_created && dateCreatedToISO(l.date_created))
          .slice(0, 30)
          .map((l) => new Date(dateCreatedToISO(l.date_created!)!).getFullYear())
      ),
    ].sort();

    if (parseable === 0) {
      debugSessionLog({
        hypothesisId: "H-NODATE",
        runId: "backfill",
        location: "backfill-lead-dates:POST",
        message: "no parseable dates in file",
        data: {
          dateColDetected,
          rawHeaders: rawHeaders.slice(0, 20),
          rowCount: normalized.length,
        },
      });
      return NextResponse.json(
        {
          error: `No dates found in file. Columns: ${rawHeaders.join(", ") || "none"}. Privyr exports need "Date Created" or "Date Added".`,
          date_column: dateColDetected ?? undefined,
          raw_headers: rawHeaders,
          dates_parseable: 0,
        },
        { status: 400 }
      );
    }

    const patches = buildLeadDatePatches(normalized);
    const { updated, failed } = await batchUpdateLeadDatesForOwner(
      db,
      ownerUserId,
      patches
    );

    debugSessionLog({
      hypothesisId: "H-BACKFILL",
      runId: "backfill",
      location: "backfill-lead-dates:POST",
      message: "backfill completed",
      data: {
        ownerUserId,
        dateColDetected,
        parseable,
        sampleYears,
        updated,
        failed,
        patchCount: patches.length,
      },
    });

    return NextResponse.json({
      success: true,
      owner_name: profile.full_name,
      owner_email: profile.email,
      dates_parseable: parseable,
      date_column: dateColDetected ?? undefined,
      sample_years: sampleYears,
      leads_updated: updated,
      leads_failed: failed,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Backfill failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
