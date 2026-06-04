"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dateCreatedToISO, formatLeadDateCreated } from "@/lib/lead-date-created";
import { detectDateCreatedColumn, parseLeadRows } from "@/lib/parse-leads";
import { readSpreadsheetRows } from "@/lib/read-spreadsheet";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { resolveWhatsAppMessage } from "@/lib/whatsapp-templates";
import { SOURCE_TAGS } from "@/lib/campaign-stats";
import { Upload, FileSpreadsheet, ExternalLink, Users } from "lucide-react";
import type { UserProfile } from "@/types";

interface UploadClientProps {
  salesUsers: Pick<UserProfile, "id" | "full_name" | "email">[];
  whatsappPretext?: string | null;
}

interface PreviewRow {
  clientName: string;
  whatsappNumber: string;
  packageInterest: string;
  notes: string;
  dateCreated: string;
}

async function readSheetRows(f: File): Promise<Record<string, unknown>[]> {
  const data = await f.arrayBuffer();
  return readSpreadsheetRows(data);
}

function toPreviewRows(parsed: ReturnType<typeof parseLeadRows>): PreviewRow[] {
  return parsed.map((r) => {
    const iso = r.date_created ? dateCreatedToISO(r.date_created) : null;
    return {
      clientName: r.name,
      whatsappNumber: r.whatsapp,
      packageInterest: r.package_interest,
      notes: r.notes,
      dateCreated: iso ? formatLeadDateCreated(iso) : "—",
    };
  });
}

export function UploadClient({ salesUsers, whatsappPretext }: UploadClientProps) {
  const [assignMode, setAssignMode] = useState<"single" | "round_robin">("single");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [sourceTag, setSourceTag] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [detectedDateCol, setDetectedDateCol] = useState<string | null>(null);
  const [previewParseableDates, setPreviewParseableDates] = useState(0);

  const toggleRoundRobinUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError("");
    setSuccess("");
    if (f) {
      if (!campaignName) setCampaignName(f.name.replace(/\.(xlsx|xls|csv)$/i, ""));
      parsePreview(f);
    }
    if (e.target) (e.target as HTMLInputElement).value = "";
  };

  const parsePreview = async (f: File) => {
    try {
      const json = await readSheetRows(f);
      if (json.length === 0) {
        setPreview([]);
        setPreviewTotal(0);
        setError("File is empty");
        return;
      }
      const parsed = parseLeadRows(json);
      if (parsed.length === 0) {
        setPreview([]);
        setPreviewTotal(0);
        setError(
          'No valid WhatsApp numbers found. Use columns like "WhatsApp Number", "Phone", or "Mobile".'
        );
        return;
      }
      const parseableDates = parsed.filter(
        (r) => r.date_created && dateCreatedToISO(r.date_created)
      ).length;
      const sampleYears = [
        ...new Set(
          parsed
            .filter((r) => r.date_created && dateCreatedToISO(r.date_created))
            .slice(0, 30)
            .map((r) => new Date(dateCreatedToISO(r.date_created!)!).getFullYear())
        ),
      ].sort();
      // #region agent log
      fetch("http://127.0.0.1:7550/ingest/9ea49f98-0131-4e47-8093-2c8680050cb4", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ef1fce" },
        body: JSON.stringify({
          sessionId: "ef1fce",
          hypothesisId: "H-EXCEL",
          location: "upload/client.tsx:parsePreview",
          message: "excel parse preview",
          data: {
            fileName: f.name,
            columns: json.length > 0 ? Object.keys(json[0]) : [],
            totalRows: parsed.length,
            parseableDates,
            sampleYears,
            sampleRawDates: parsed
              .filter((r) => r.date_created)
              .slice(0, 3)
              .map((r) => r.date_created),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const headers = json.length > 0 ? Object.keys(json[0]) : [];
      const dateCol = detectDateCreatedColumn(headers);
      setDetectedDateCol(dateCol);
      setPreviewParseableDates(parseableDates);
      setPreviewTotal(parsed.length);
      setPreview(toPreviewRows(parsed).slice(0, 10));
      const colList = headers.join(", ") || "none";
      setError(
        parseableDates === 0
          ? `No dates detected in this file. Columns found: ${colList}. For Privyr CSV, include "Date Added". Or add "Date Created" with real dates, then re-upload.`
          : ""
      );
    } catch {
      setError("Failed to parse file. Please check the file format.");
      setPreview([]);
      setPreviewTotal(0);
    }
  };

  const canUpload =
    file &&
    previewTotal > 0 &&
    (assignMode === "single" ? selectedUser : selectedUsers.length >= 2);

  const canRefreshDatesOnly =
    file &&
    previewTotal > 0 &&
    previewParseableDates > 0 &&
    assignMode === "single" &&
    !!selectedUser;

  const handleRefreshDatesOnly = async () => {
    if (!canRefreshDatesOnly || !file) {
      setError(
        "Select sales user and a file with parseable dates (preview must show 2024/2020 dates, not all —)."
      );
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const json = await readSheetRows(file);
      const res = await fetch("/api/admin/backfill-lead-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: json, ownerUserId: selectedUser }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Date refresh failed");

      setSuccess(
        `Date refresh OK: ${result.leads_updated} leads updated for ${result.owner_name} from "${result.date_column || detectedDateCol || "file"}" (years: ${(result.sample_years || []).join(", ")}). Ask sales to hard-refresh My Tasks.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Date refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!canUpload) {
      setError(
        assignMode === "round_robin"
          ? "Select file and at least 2 sales users for round-robin"
          : "Please select a sales user and file"
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const json = await readSheetRows(file!);
      if (json.length === 0) throw new Error("File is empty");

      const res = await fetch("/api/admin/upload-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: json,
          fileName: file!.name,
          campaignName: campaignName.trim() || file!.name,
          sourceTag,
          assignMode,
          ownerUserId: assignMode === "single" ? selectedUser : undefined,
          ownerUserIds: assignMode === "round_robin" ? selectedUsers : undefined,
          uploadedByAdminId: user.id,
          reassignExisting: true,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      const assignDetail = (
        result.assignments as {
          ownerName: string;
          ownerEmail: string;
          rows: number;
          inserted: number;
          reassigned: number;
          datesUpdated?: number;
        }[]
      )
        ?.map((a) => {
          const dates =
            a.datesUpdated && a.datesUpdated > 0
              ? `, ${a.datesUpdated} dates refreshed`
              : "";
          return `${a.ownerName} (${a.ownerEmail}): ${a.rows} tasks (${a.inserted} new, ${a.reassigned || 0} transferred${dates})`;
        })
        .join(" · ");

      const skipped = result.skipped_rows ? ` ${result.skipped_rows} empty rows skipped.` : "";
      const datesTotal = result.total_dates_updated
        ? ` ${result.total_dates_updated} existing leads updated with Excel/Privyr dates.`
        : "";
      const parseHint =
        result.dates_parseable > 0
          ? ` Parsed ${result.dates_parseable} rows with dates${result.sample_years?.length ? ` (years: ${result.sample_years.join(", ")})` : ""}${result.date_column ? ` from "${result.date_column}"` : ""}.`
          : result.date_column
            ? ` Date column "${result.date_column}" detected but few rows parsed — check date format.`
            : "";

      setSuccess(
        `Campaign "${result.campaign_name || campaignName}" assigned. ${assignDetail || result.total_rows + " leads"}.${datesTotal}${parseHint}${skipped} Sales user must log in with that email to see My Tasks.`
      );
      setFile(null);
      setPreview([]);
      setPreviewTotal(0);
      setSelectedUser("");
      setSelectedUsers([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card-padded space-y-5">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Assign Campaign / Upload</h2>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Campaign name</label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. LEAD DARI ALIF — Jun 2026"
            className="input-field"
          />
        </div>

        <div>
          <label style={{ color: "var(--text-secondary)" }}>Lead source</label>
          <select value={sourceTag} onChange={(e) => setSourceTag(e.target.value)} className="input-field">
            <option value="">— Select source —</option>
            {SOURCE_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Assignment mode</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAssignMode("single")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                assignMode === "single"
                  ? "filter-pill-active"
                  : "filter-pill"
              }`}
            >
              Single user
            </button>
            <button
              type="button"
              onClick={() => setAssignMode("round_robin")}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-1.5 ${
                assignMode === "round_robin"
                  ? "filter-pill-active"
                  : "filter-pill"
              }`}
            >
              <Users className="w-4 h-4" />
              Round-robin
            </button>
          </div>
        </div>

        {assignMode === "single" ? (
          <div>
            <label style={{ color: "var(--text-secondary)" }}>Assign to sales user</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="input-field">
              <option value="">— Select sales user —</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Select 2+ users (leads split evenly)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto rounded-xl p-3" style={{ border: "1px solid var(--border-color)" }}>
              {salesUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleRoundRobinUser(u.id)}
                    className="rounded border-slate-300 text-primary"
                  />
                  {u.full_name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ color: "var(--text-secondary)" }}>Excel/CSV file</label>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer"
            style={{ borderColor: "var(--border-color)", background: "var(--surface-muted)" }}
          >
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{file ? file.name : "Click to select file"}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Privyr CSV: include <strong>Date Created</strong> or <strong>Date Added</strong>. Use &quot;Refresh dates only&quot; to fix My Tasks without re-assigning leads.
              </p>
            </label>
          </div>
          {file && previewTotal > 0 && (
            <p className="text-xs mt-2" style={{ color: previewParseableDates > 0 ? "var(--success, #15803d)" : "var(--text-muted)" }}>
              {previewParseableDates > 0
                ? `${previewParseableDates} rows with dates detected${detectedDateCol ? ` (column: "${detectedDateCol}")` : ""}.`
                : "No dates detected yet — export from Privyr with Date Created before refreshing."}
            </p>
          )}
        </div>

        {assignMode === "single" && (
          <button
            type="button"
            onClick={handleRefreshDatesOnly}
            disabled={loading || !canRefreshDatesOnly}
            className="btn-secondary w-full py-2.5"
          >
            {loading ? "Working..." : "Refresh dates only (fix My Tasks Date Created)"}
          </button>
        )}

        <button onClick={handleUpload} disabled={loading || !canUpload} className="btn-primary-solid w-full py-2.5">
          <Upload className="w-4 h-4" />
          {loading ? "Uploading..." : "Upload & Assign Task"}
        </button>
      </div>

      <div className="card-padded">
        <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Preview</h2>
        {preview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-3 py-2 text-xs uppercase">Name</th>
                  <th className="text-left px-3 py-2 text-xs uppercase">WhatsApp</th>
                  <th className="text-left px-3 py-2 text-xs uppercase">Package</th>
                  <th className="text-left px-3 py-2 text-xs uppercase">Date Created</th>
                  <th className="text-center px-3 py-2 text-xs uppercase">WA</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="px-3 py-2 font-medium">{row.clientName || "-"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.whatsappNumber || "-"}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{row.packageInterest || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{row.dateCreated}</td>
                    <td className="px-3 py-2 text-center">
                      {row.whatsappNumber ? (
                        <a
                          href={getWhatsAppLink(
                            row.whatsappNumber,
                            resolveWhatsAppMessage(whatsappPretext, row.clientName)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp px-2 py-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-red-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              Showing {preview.length} of {previewTotal} valid rows
            </p>
          </div>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>Select a file to preview</p>
        )}
      </div>
    </div>
  );
}
