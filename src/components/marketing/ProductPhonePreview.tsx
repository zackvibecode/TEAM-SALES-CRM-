"use client";

import { Calendar, MessageCircle, Sparkles } from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

const SAMPLE_LEADS = [
  { name: "Selver Kumar", date: "4 Jun 2024, 12:00 am", status: "Pending" },
  { name: "Nora Hamid", date: "4 Jun 2024, 12:01 am", status: "Pending" },
  { name: "Deedat", date: "4 Jun 2024, 12:02 am", status: "Clicked" },
];

export function ProductPhonePreview() {
  const { locale } = useMarketingLocale();
  const isBm = locale === "bm";

  const labels = {
    app: "Zaqone CRM",
    screen: isBm ? "Tugasan Saya" : "My Tasks",
    mission: isBm ? "0 / 100 follow-up hari ini" : "0 / 100 follow-ups today",
    tabAll: isBm ? "Semua lead" : "All leads",
    tabPending: "Pending",
    customize: isBm ? "Sesuaikan tarikh" : "Customize by date",
    sort: isBm ? "Lama → Baru" : "Old → New",
    colDate: isBm ? "Tarikh dicipta" : "Date Created",
    leads: isBm ? "2,964 pelanggan" : "2,964 customers",
    wa: "WhatsApp",
  };

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px]">
      <div
        className="absolute -inset-4 rounded-[2.5rem] opacity-60 blur-2xl motion-reduce:hidden"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(59, 102, 255, 0.35), transparent 55%), radial-gradient(circle at 70% 80%, rgba(37, 211, 102, 0.2), transparent 50%)",
        }}
      />

      <div
        className="absolute -top-3 -right-2 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg"
        style={{
          background: "var(--surface-card)",
          color: "#3b66ff",
          border: "1px solid var(--border-color)",
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {labels.leads}
      </div>

      <div
        className="relative rounded-[2.25rem] p-2.5 shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #1e3a8a 100%)",
        }}
      >
        <div
          className="overflow-hidden rounded-[1.85rem]"
          style={{
            background: "var(--surface-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Status bar */}
          <div
            className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[10px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            <span>9:41</span>
            <div className="flex gap-1">
              <span className="w-3 h-1.5 rounded-sm bg-slate-400/80" />
              <span className="w-3 h-1.5 rounded-sm bg-slate-400/80" />
              <span className="w-4 h-1.5 rounded-sm bg-[#3b66ff]" />
            </div>
          </div>

          {/* App header */}
          <div
            className="px-3 pb-2 border-b"
            style={{ borderColor: "var(--border-color)", background: "var(--surface-card)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#3b66ff]">
              {labels.app}
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {labels.screen}
            </p>
          </div>

          {/* Mission card */}
          <div className="px-3 pt-2">
            <div
              className="rounded-xl px-3 py-2 text-[10px] font-medium"
              style={{
                background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
                color: "var(--text-secondary)",
                border: "1px solid #c7d2fe",
              }}
            >
              <span className="font-bold text-[#3b66ff]">{labels.mission}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2 overflow-x-auto scrollbar-none">
            <span className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold bg-[#3b66ff] text-white">
              {labels.tabAll}
            </span>
            <span
              className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-semibold"
              style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
            >
              {labels.tabPending}
            </span>
            <span
              className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-semibold"
              style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
            >
              Clicker
            </span>
          </div>

          {/* Date tools */}
          <div className="flex flex-wrap gap-1 px-3 pt-2">
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold border"
              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            >
              <Calendar className="w-2.5 h-2.5" />
              {labels.customize}
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-[#3b66ff] text-white">
              {labels.sort}
            </span>
          </div>

          {/* Mini table */}
          <div className="px-3 pt-2 pb-3">
            <div
              className="rounded-xl overflow-hidden text-[9px]"
              style={{
                border: "1px solid var(--border-color)",
                background: "var(--surface-card)",
              }}
            >
              <div
                className="px-2 py-1.5 font-bold uppercase tracking-wide text-[8px]"
                style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
              >
                Name · {labels.colDate}
              </div>
              {SAMPLE_LEADS.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center gap-2 px-2 py-1.5 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-[9px]" style={{ color: "var(--text-primary)" }}>
                      {lead.name}
                    </p>
                    <p className="text-[8px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                      {lead.date}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] font-semibold ${
                        lead.status === "Clicked"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lead.status}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold text-white"
                      style={{ background: "#25d366" }}
                    >
                      <MessageCircle className="w-2.5 h-2.5" />
                      {labels.wa}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2">
            <div className="w-24 h-1 rounded-full bg-slate-300/80 dark:bg-slate-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
