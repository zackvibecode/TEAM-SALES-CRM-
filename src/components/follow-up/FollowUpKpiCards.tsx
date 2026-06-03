"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { CalendarClock, AlertTriangle, ListChecks } from "lucide-react";
import type { FollowUpKpiStats } from "@/lib/follow-up/types";

export function FollowUpKpiCards({ compact }: { compact?: boolean }) {
  const [kpis, setKpis] = useState<FollowUpKpiStats | null>(null);

  useEffect(() => {
    fetch("/api/follow-ups/kpi", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.kpis) setKpis(d.kpis);
      })
      .catch(() => {});
  }, []);

  if (!kpis) return null;

  const grid = compact
    ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
    : "grid grid-cols-1 sm:grid-cols-3 gap-4";

  return (
    <div className={grid}>
      <StatCard label="Follow Up Today" value={kpis.today} icon={CalendarClock} accent="sky" />
      <StatCard label="Overdue Follow Ups" value={kpis.overdue} icon={AlertTriangle} accent="blue" />
      <StatCard label="Total Follow Ups" value={kpis.total} icon={ListChecks} accent="sky" />
    </div>
  );
}
