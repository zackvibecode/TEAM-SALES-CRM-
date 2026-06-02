import { createServerSupabaseClient, createDbClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilesClient } from "./client";
import { computeBatchStats } from "@/lib/campaign-stats";

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createDbClient();

  const [{ data: files }, { data: salesUsers }, { data: leadRows }] = await Promise.all([
    db
      .from("uploaded_files")
      .select("*, owner:owner_user_id (full_name, email)")
      .order("created_at", { ascending: false }),
    db.from("profiles").select("id, full_name").eq("role", "sales").order("full_name"),
    db.from("leads").select("source_file_id, status"),
  ]);

  const statsByFile = new Map<string, { status: string }[]>();
  for (const row of leadRows || []) {
    if (!row.source_file_id) continue;
    const list = statsByFile.get(row.source_file_id) || [];
    list.push({ status: row.status });
    statsByFile.set(row.source_file_id, list);
  }

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <PageHeader badge="Batches" title="Campaigns & Batches" subtitle="Track assignment progress per upload" />
        <FilesClient
          salesUsers={salesUsers || []}
          initialFiles={(files || []).map((f) => {
            const stats = computeBatchStats(statsByFile.get(f.id) || []);
            return {
              id: f.id,
              file_name: f.file_name,
              campaign_name: f.campaign_name ?? null,
              source_tag: f.source_tag ?? null,
              owner_id: f.owner_user_id,
              owner_name: (f.owner as { full_name: string })?.full_name || "Unknown",
              total_rows: f.total_rows,
              pending: stats.pending,
              progress: stats.progress,
              is_archived: f.is_archived ?? false,
              created_at: f.created_at,
            };
          })}
        />
      </div>
    </AppLayout>
  );
}
