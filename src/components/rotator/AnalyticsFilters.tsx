"use client";

interface FilterOption {
  id: string;
  name: string;
}

interface AnalyticsFiltersProps {
  startDate: string;
  endDate: string;
  pageId: string;
  salesMemberId: string;
  source: string;
  campaign: string;
  pages: FilterOption[];
  members: FilterOption[];
  sources: string[];
  campaigns: string[];
  onChange: (key: string, value: string) => void;
  onApply: () => void;
}

export function AnalyticsFilters({
  startDate,
  endDate,
  pageId,
  salesMemberId,
  source,
  campaign,
  pages,
  members,
  sources,
  campaigns,
  onChange,
  onApply,
}: AnalyticsFiltersProps) {
  return (
    <div className="card-padded-sm flex flex-wrap gap-3 items-end">
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>From</label>
        <input type="date" value={startDate} onChange={(e) => onChange("startDate", e.target.value)} className="input-field py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>To</label>
        <input type="date" value={endDate} onChange={(e) => onChange("endDate", e.target.value)} className="input-field py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Landing Page</label>
        <select value={pageId} onChange={(e) => onChange("pageId", e.target.value)} className="input-field py-2 text-sm min-w-[140px]">
          <option value="">All</option>
          {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Sales Person</label>
        <select value={salesMemberId} onChange={(e) => onChange("salesMemberId", e.target.value)} className="input-field py-2 text-sm min-w-[140px]">
          <option value="">All</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Source</label>
        <select value={source} onChange={(e) => onChange("source", e.target.value)} className="input-field py-2 text-sm">
          <option value="">All</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Campaign</label>
        <select value={campaign} onChange={(e) => onChange("campaign", e.target.value)} className="input-field py-2 text-sm">
          <option value="">All</option>
          {campaigns.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button type="button" onClick={onApply} className="btn-primary-solid text-sm">Apply</button>
    </div>
  );
}
