"use client";

import {
  ArrowUpDown,
  CalendarRange,
  Clock,
  MessageCircle,
  Search,
  Target,
} from "lucide-react";
import { useMarketingLocale } from "./MarketingLocaleProvider";

const LEADS = [
  { name: "Selver Kumar", wa: "60123456789", date: "4 Jun 2024", status: "Pending" },
  { name: "Nora Hamid", wa: "60198765432", date: "4 Jun 2024", status: "Pending" },
  { name: "Deedat", wa: "60111222333", date: "4 Jun 2024", status: "Clicked" },
];

export function ProductPhonePreview() {
  const { locale } = useMarketingLocale();
  const isBm = locale === "bm";

  const t = {
    queue: "Queue",
    title: isBm ? "Tugasan Saya" : "My Tasks",
    subtitle: isBm ? "Alip · nusatra00@gmail.com" : "Alip · nusatra00@gmail.com",
    mission: isBm ? "Misi hari ini" : "Today's mission",
    missionStat: isBm ? "0 / 100 follow-up" : "0 / 100 follow-ups",
    missionHint: isBm
      ? "2,964 pending dalam buku · 2,964 jumlah lead"
      : "2,964 pending in your book · 2,964 total leads",
    bookBar: isBm
      ? "Buku anda: 2,964 lead · 2,964 pending"
      : "Your book: 2,964 leads · 2,964 pending",
    tabQueue: isBm ? "Queue (Pending)" : "My queue (Pending)",
    tabAll: isBm ? "Semua lead" : "All leads",
    tabPending: "Pending",
    tabFollow: "Follow Up",
    tabClicker: "Clicker",
    search: isBm ? "Cari nama atau WhatsApp..." : "Search name or WhatsApp...",
    customize: isBm ? "Sesuaikan tarikh" : "Customize by date",
    sort: isBm ? "Lama → Baru" : "Old → New",
    count: isBm ? "2,964 pelanggan" : "2,964 customers",
    colName: "Name",
    colWa: "WhatsApp",
    colDate: isBm ? "Tarikh dicipta" : "Date Created",
    colStatus: "Status",
    wa: "WhatsApp",
    pillFollow: isBm ? "Follow-up teratur" : "Organized follow-ups",
    pillWa: isBm ? "WhatsApp 1-klik" : "1-tap WhatsApp",
    pillSort: isBm ? "Sort ikut tarikh" : "Sort by date",
  };

  return (
    <div className="phone-showcase relative mx-auto w-full max-w-[288px] lg:max-w-[288px] lg:mx-0">
      <div className="phone-shadow-static" aria-hidden />

      {/* Benefit pills */}
      <span className="phone-benefit phone-benefit-1 motion-reduce:hidden">{t.pillFollow}</span>
      <span className="phone-benefit phone-benefit-2 motion-reduce:hidden">{t.pillWa}</span>
      <span className="phone-benefit phone-benefit-3 motion-reduce:hidden">{t.pillSort}</span>

      {/* iPhone 17 Pro frame */}
      <div className="phone-frame-17 relative z-10 mx-auto">
        <div className="phone-dynamic-island" aria-hidden />
        <div className="phone-screen-inner">
          <div className="phone-app-view">
            <div className="phone-app-content space-y-2 p-2">
              {/* Page header — matches sales My Tasks */}
              <div>
                <span className="phone-page-badge">{t.queue}</span>
                <p className="phone-page-title">{t.title}</p>
                <p className="phone-page-sub">{t.subtitle}</p>
              </div>

              {/* Daily goal panel */}
              <div className="phone-mission-card">
                <div className="flex items-center gap-1 text-[#3b66ff] mb-1">
                  <Target className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-wide">{t.mission}</span>
                </div>
                <p className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {t.missionStat}
                </p>
                <p className="text-[8px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t.missionHint}
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full w-[8%] rounded-full bg-[#3b66ff]" />
                </div>
              </div>

              {/* Book bar */}
              <div className="phone-glass-bar text-[8px]">{t.bookBar}</div>

              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
                <span className="phone-tab phone-tab-active">
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                  {t.tabQueue}
                </span>
                <span className="phone-tab">{t.tabAll}</span>
                <span className="phone-tab">{t.tabPending}</span>
                <span className="phone-tab">{t.tabFollow}</span>
                <span className="phone-tab">{t.tabClicker}</span>
              </div>

              {/* Search + tools */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <div className="phone-input pl-7">{t.search}</div>
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="phone-tool">
                    <CalendarRange className="w-2.5 h-2.5" />
                    {t.customize}
                  </span>
                  <span className="phone-tool phone-tool-active">
                    <ArrowUpDown className="w-2.5 h-2.5" />
                    {t.sort}
                  </span>
                  <span className="text-[8px] ml-auto" style={{ color: "var(--text-muted)" }}>
                    {t.count}
                  </span>
                </div>
              </div>

              {/* Table — real My Tasks columns */}
              <div className="phone-table-shell">
                <div className="phone-table-head grid grid-cols-[1.2fr_1fr_0.9fr] gap-0.5 px-1.5 py-1">
                  <span>{t.colName}</span>
                  <span>{t.colDate}</span>
                  <span className="text-center">{t.colStatus}</span>
                </div>
                {LEADS.map((lead) => (
                  <div
                    key={lead.name}
                    className="phone-table-row grid grid-cols-[1.2fr_1fr_0.9fr] gap-0.5 px-1.5 py-1.5 items-center border-t"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[9px] truncate text-slate-800">{lead.name}</p>
                      <p className="text-[7px] font-mono text-slate-500 truncate">{lead.wa}</p>
                    </div>
                    <p className="text-[7px] text-slate-600 whitespace-nowrap">{lead.date}</p>
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`text-[7px] font-semibold px-1 py-0.5 rounded-full ${
                          lead.status === "Clicked"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {lead.status}
                      </span>
                      <span className="phone-wa-btn">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {t.wa}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="phone-home-bar" aria-hidden />
      </div>
    </div>
  );
}
