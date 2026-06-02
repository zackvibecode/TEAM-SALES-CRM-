export interface BatchStats {
  total: number;
  pending: number;
  clicked: number;
  followUp: number;
  interested: number;
  converted: number;
  progress: number;
}

export function computeBatchStats(
  leads: { status: string }[]
): BatchStats {
  const total = leads.length;
  const pending = leads.filter((l) => l.status === "Pending").length;
  const clicked = leads.filter((l) => l.status === "Clicked").length;
  const followUp = leads.filter((l) => l.status === "Follow Up").length;
  const interested = leads.filter((l) => l.status === "Interested").length;
  const converted = leads.filter((l) => l.status === "Converted").length;
  const worked = total - pending;
  const progress = total > 0 ? Math.round((worked / total) * 100) : 0;

  return { total, pending, clicked, followUp, interested, converted, progress };
}

export const SOURCE_TAGS = [
  "Alif",
  "Facebook",
  "Instagram",
  "Walk-in",
  "Referral",
  "Other",
] as const;
