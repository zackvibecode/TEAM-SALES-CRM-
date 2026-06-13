"use client";

import { AdminPageShell } from "@/components/i18n/PageShells";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import { FilesClient } from "./client";

type FileRow = Parameters<typeof FilesClient>[0]["initialFiles"][number];

export function AdminFilesPageClient({
  initialFiles,
  salesUsers,
}: {
  initialFiles: FileRow[];
  salesUsers: { id: string; full_name: string }[];
}) {
  const { t } = useAppLocale();

  return (
    <AdminPageShell
      section="files"
      actions={
        <a href="/api/admin/export-leads" className="btn-primary-solid text-sm">
          {t.admin.files.exportCsv}
        </a>
      }
    >
      <FilesClient salesUsers={salesUsers} initialFiles={initialFiles} />
    </AdminPageShell>
  );
}
