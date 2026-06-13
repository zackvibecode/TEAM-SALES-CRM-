"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PackageStatsCards } from "@/components/admin/PackageStatsCards";
import { PackageTable } from "@/components/admin/PackageTable";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { Promo } from "@/types/promo";

interface PackagesPageClientProps {
  promos: Promo[];
  currentUserId: string;
}

export function PackagesPageClient({ promos: initialPromos }: PackagesPageClientProps) {
  const router = useRouter();
  const { t } = useAppLocale();
  const [promos, setPromos] = useState<Promo[]>(initialPromos);

  const handleDelete = (id: string) => {
    setPromos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title={t.admin.packages.pageTitle}
        subtitle={t.admin.packages.pageSubtitle}
        actions={
          <button
            type="button"
            onClick={() => router.push("/admin/packages/new")}
            className="inline-flex items-center justify-center gap-1.5 font-semibold text-white text-xs rounded-lg px-3.5 py-2 transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#ef4444" }}
          >
            <Plus className="w-4 h-4" />
            {t.admin.packages.newPackage}
          </button>
        }
      />

      <PackageStatsCards promos={promos} />

      <PackageTable
        promos={promos}
        basePath="/admin/packages"
        onDelete={handleDelete}
      />
    </div>
  );
}
