"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RotatorPreviewModal } from "@/components/rotator/RotatorPreviewModal";
import { DEFAULT_LOADING_TEXT, normalizeImageSize } from "@/lib/rotator/display";
import { getRotatorPreviewPath, getRotatorPublicPath } from "@/lib/rotator/urls";
import { RotatorResetClicks } from "@/components/rotator/RotatorResetClicks";
import type { RotatorPage } from "@/types/rotator";

type PageRow = RotatorPage & {
  public_url: string;
  total_clicks: number;
  unique_clicks: number;
  assigned_sales_count: number;
};

export function RotatorPagesClient({ initialPages }: { initialPages: PageRow[] }) {
  const router = useRouter();
  const [previewPage, setPreviewPage] = useState<PageRow | null>(null);

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rotator page?")) return;
    const res = await fetch(`/api/admin/rotator/pages?id=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert((await res.json()).error || "Delete failed");
  };

  return (
    <>
      <DataTable
        data={initialPages as unknown as Record<string, unknown>[]}
        searchKeys={["name", "slug"]}
        searchPlaceholder="Search landing pages..."
        columns={[
          { key: "name", label: "Page Name" },
          {
            key: "public_url",
            label: "Public URL",
            render: (row) => (
              <span className="text-[#3b66ff] text-xs">{row.public_url as string}</span>
            ),
          },
          { key: "total_clicks", label: "Total Clicks" },
          { key: "unique_clicks", label: "Unique Clicks" },
          {
            key: "is_active",
            label: "Status",
            render: (row) => {
              const noSales = (row.assigned_sales_count as number) === 0;
              return (
                <div className="space-y-1">
                  <span className={`text-xs font-medium ${row.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                  {noSales && (
                    <span className="block text-[10px] font-medium text-amber-700">
                      Tiada sales team — link akan error
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "actions",
            label: "Action",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPage(row as unknown as PageRow)}
                  className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <a
                  href={getRotatorPreviewPath(row.slug as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Buka Preview
                </a>
                <a
                  href={getRotatorPublicPath(row.slug as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka Link
                </a>
                <button
                  type="button"
                  onClick={() => copyLink(row.public_url as string)}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Copy Link
                </button>
                <RotatorResetClicks
                  compact
                  pageId={row.id as string}
                  pageName={row.name as string}
                  onReset={() => router.refresh()}
                />
                <Link
                  href={`/dashboard/rotator-team/pages/${row.id}/edit`}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id as string)}
                  className="text-xs text-red-600 hover:underline py-1 px-2"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {previewPage && (
        <RotatorPreviewModal
          open={!!previewPage}
          onClose={() => setPreviewPage(null)}
          name={previewPage.name}
          slug={previewPage.slug}
          imageUrl={previewPage.image_url}
          loadingText={previewPage.loading_text || DEFAULT_LOADING_TEXT}
          imageSize={normalizeImageSize(previewPage.image_size)}
        />
      )}
    </>
  );
}
