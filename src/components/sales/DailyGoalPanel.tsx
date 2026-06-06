"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Sparkles, Settings2 } from "lucide-react";
import { CongratsModal } from "./CongratsModal";

interface DailyStats {
  goal: number;
  todayCompleted: number;
  totalLeads: number;
  pendingLeads: number;
  goalReached: boolean;
}

export function DailyGoalPanel({ onGoalReached }: { onGoalReached?: () => void }) {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("50");
  const [showCongrats, setShowCongrats] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/sales/daily-stats");
    const data = await res.json();
    if (res.ok) {
      setStats(data);
      setGoalInput(String(data.goal));
      const todayKey = new Date().toISOString().slice(0, 10);
      const celebrated = localStorage.getItem(`zaqone_congrats_${todayKey}`);
      if (data.goalReached && !celebrated) {
        setShowCongrats(true);
        localStorage.setItem(`zaqone_congrats_${todayKey}`, "1");
        onGoalReached?.();
      }
    }
    setLoading(false);
  }, [onGoalReached]);

  useEffect(() => {
    loadStats();
    const onRefresh = () => loadStats();
    window.addEventListener("zaqone:refresh-daily", onRefresh);
    return () => window.removeEventListener("zaqone:refresh-daily", onRefresh);
  }, [loadStats]);

  const saveGoal = async () => {
    const res = await fetch("/api/sales/daily-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: parseInt(goalInput, 10) }),
    });
    if (res.ok) {
      setEditingGoal(false);
      loadStats();
    }
  };

  if (loading || !stats) {
    return <div className="surface-card animate-pulse h-28 rounded-lg" />;
  }

  const pct = Math.min(100, Math.round((stats.todayCompleted / stats.goal) * 100));

  return (
    <>
      <div className="card-padded-sm h-full min-h-[280px] flex flex-col justify-center">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Target className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Today&apos;s mission</span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {stats.todayCompleted}
              <span className="text-base font-medium" style={{ color: "var(--text-muted)" }}>
                {" "}/ {stats.goal} follow-ups
              </span>
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stats.pendingLeads.toLocaleString()} pending in your book · {stats.totalLeads.toLocaleString()} total leads
            </p>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-muted)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div className="shrink-0">
            {editingGoal ? (
              <div className="flex flex-col gap-2 min-w-[140px]">
                <input type="number" min={1} max={500} value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="input-field" />
                <button onClick={saveGoal} className="btn-primary-solid text-sm">Save goal</button>
              </div>
            ) : (
              <button
                onClick={() => setEditingGoal(true)}
                className="btn-secondary"
              >
                <Settings2 className="w-4 h-4" />
                Custom daily target
              </button>
            )}
          </div>
        </div>
        {stats.goalReached && (
          <p className="mt-4 text-sm text-emerald-600 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Daily target reached — great work!
          </p>
        )}
      </div>
      <CongratsModal
        open={showCongrats}
        onClose={() => setShowCongrats(false)}
        completed={stats.todayCompleted}
        goal={stats.goal}
      />
    </>
  );
}
