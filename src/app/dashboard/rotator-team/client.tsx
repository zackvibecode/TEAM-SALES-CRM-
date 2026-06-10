"use client";

import { useCallback, useEffect, useState } from "react";
import { MousePointerClick, Users, Copy, TrendingUp, ExternalLink, Eye } from "lucide-react";
import { getRotatorPreviewPath, getRotatorPublicPath } from "@/lib/rotator/urls";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { AnalyticsFilters } from "@/components/rotator/AnalyticsFilters";
import { RotatorResetClicks } from "@/components/rotator/RotatorResetClicks";

interface AnalyticsData {
  stats: {
    totalClicks: number;
    uniqueClicks: number;
    duplicateClicks: number;
    todayClicks: number;
    monthClicks: number;
  };
  pages: Array<{
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    public_url: string;
    total_clicks: number;
    unique_clicks: number;
  }>;
  salesPerformance: Array<{
    id: string;
    name: string;
    phone: string;
    is_active: boolean;
    total_assigned: number;
    unique_clicks: number;
    duplicate_clicks: number;
  }>;
  latestActivity: Array<{
    id: string;
    clicked_at: string;
    page_name: string;
    sales_name: string;
    source: string;
    campaign: string;
    is_duplicate: boolean;
  }>;
  filterOptions: {
    pages: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    sources: string[];
    campaigns: string[];
  };
}

export function RotatorOverviewClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    pageId: "",
    salesMemberId: "",
    source: "",
    campaign: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    try {
      const res = await fetch(`/api/admin/rotator/analytics?${params}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const copyLink = (path: string) => {
    const full = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(full);
  };

  if (loading && !data) {
    return <p style={{ color: "var(--text-muted)" }}>Loading analytics...</p>;
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        {...filters}
        pages={data?.filterOptions.pages || []}
        members={data?.filterOptions.members || []}
        sources={data?.filterOptions.sources || []}
        campaigns={data?.filterOptions.campaigns || []}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onApply={loadData}
      />

      <RotatorResetClicks onReset={loadData} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Clicks" value={stats?.totalClicks ?? 0} icon={MousePointerClick} accent="blue" />
        <StatCard label="Unique Clicks" value={stats?.uniqueClicks ?? 0} icon={TrendingUp} accent="mint" />
        <StatCard label="Duplicate Clicks" value={stats?.duplicateClicks ?? 0} icon={Copy} accent="amber" />
        <StatCard label="Today Clicks" value={stats?.todayClicks ?? 0} accent="sky" />
        <StatCard label="This Month" value={stats?.monthClicks ?? 0} accent="slate" />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Rotator Landing Pages</h2>
        <DataTable
          data={(data?.pages || []) as Record<string, unknown>[]}
          searchKeys={["name", "slug"]}
          searchPlaceholder="Search pages..."
          columns={[
            { key: "name", label: "Page Name" },
            {
              key: "public_url",
              label: "Public URL",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => copyLink(row.public_url as string)}
                  className="text-[#3b66ff] hover:underline text-xs"
                >
                  {row.public_url as string}
                </button>
              ),
            },
            { key: "total_clicks", label: "Total Clicks" },
            { key: "unique_clicks", label: "Unique Clicks" },
            {
              key: "is_active",
              label: "Status",
              render: (row) => (
                <span className={`text-xs font-medium ${row.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                  {row.is_active ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={getRotatorPreviewPath(row.slug as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary-solid text-xs py-1 px-2 inline-flex items-center gap-1"
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
                    onReset={loadData}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Users className="w-4 h-4" /> Sales Performance
        </h2>
        <DataTable
          data={(data?.salesPerformance || []) as Record<string, unknown>[]}
          searchKeys={["name", "phone"]}
          columns={[
            { key: "name", label: "Sales Name" },
            { key: "phone", label: "Phone Number" },
            { key: "total_assigned", label: "Total Assigned" },
            { key: "unique_clicks", label: "Unique Clicks" },
            { key: "duplicate_clicks", label: "Duplicate Clicks" },
            {
              key: "is_active",
              label: "Status",
              render: (row) => (
                <span className={`text-xs font-medium ${row.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                  {row.is_active ? "Active" : "Inactive"}
                </span>
              ),
            },
          ]}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Latest Activity</h2>
        <DataTable
          data={(data?.latestActivity || []) as Record<string, unknown>[]}
          emptyMessage="No clicks recorded yet."
          columns={[
            {
              key: "clicked_at",
              label: "Date / Time",
              render: (row) => new Date(row.clicked_at as string).toLocaleString(),
            },
            { key: "page_name", label: "Landing Page" },
            { key: "sales_name", label: "Sales Name" },
            { key: "source", label: "Source" },
            { key: "campaign", label: "Campaign" },
            {
              key: "is_duplicate",
              label: "Type",
              render: (row) => (
                <span className={`text-xs ${row.is_duplicate ? "text-amber-600" : "text-emerald-600"}`}>
                  {row.is_duplicate ? "Duplicate" : "Unique"}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
