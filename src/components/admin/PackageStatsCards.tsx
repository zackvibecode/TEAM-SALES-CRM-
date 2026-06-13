"use client";

import { Package, Megaphone, Users, MapPin } from "lucide-react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";
import type { Promo } from "@/types/promo";

interface PackageStatsCardsProps {
  promos: Promo[];
}

function StatTile({
  label,
  value,
  subtext,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="surface-card rounded-xl p-3 md:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p
            className="text-xl md:text-2xl font-bold tabular-nums tracking-tight leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {value.toLocaleString()}
          </p>
          <p className="text-[10px] pt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtext}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export function PackageStatsCards({ promos }: PackageStatsCardsProps) {
  const { t } = useAppLocale();

  const totalPackage = promos.length;
  const activeCount = promos.filter((p) => p.is_active).length;
  const totalSeats = promos.reduce((sum, p) => sum + (p.seats_left ?? 0), 0);

  const destinationSet = new Set<string>();
  for (const p of promos) {
    if (p.destination?.trim()) {
      destinationSet.add(p.destination.trim());
      continue;
    }
    const dates = Array.isArray(p.departure_dates) ? p.departure_dates : [];
    for (const entry of dates) {
      const name = typeof entry === "string" ? "" : entry.name?.trim();
      if (name) destinationSet.add(name);
    }
  }
  const uniqueDestinations = destinationSet.size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatTile
        label={t.admin.packages.totalPackage}
        value={totalPackage}
        subtext={t.admin.packages.allDestinationsSub}
        icon={Package}
        iconBg="rgba(239, 68, 68, 0.12)"
        iconColor="#ef4444"
      />
      <StatTile
        label={t.admin.packages.activePromotion}
        value={activeCount}
        subtext={t.admin.packages.currentlyRunning}
        icon={Megaphone}
        iconBg="rgba(16, 185, 129, 0.12)"
        iconColor="#10b981"
      />
      <StatTile
        label={t.admin.packages.seatLeft}
        value={totalSeats}
        subtext={t.admin.packages.acrossAllPackages}
        icon={Users}
        iconBg="rgba(139, 92, 246, 0.12)"
        iconColor="#8b5cf6"
      />
      <StatTile
        label={t.admin.packages.allDestination}
        value={uniqueDestinations}
        subtext={t.admin.packages.uniqueDestinationsSub}
        icon={MapPin}
        iconBg="rgba(245, 158, 11, 0.12)"
        iconColor="#f59e0b"
      />
    </div>
  );
}
