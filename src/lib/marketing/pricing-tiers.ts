export type TierId = "starter" | "pro" | "team";

export type FeatureKey =
  | "leadUpload"
  | "campaignAssign"
  | "myTasks"
  | "whatsappPretext"
  | "followUpQueue"
  | "dailyGoal"
  | "adminKpi"
  | "activityLog"
  | "auditLog"
  | "exportLeads"
  | "prioritySupport";

export interface PricingTier {
  id: TierId;
  priceMonthly: number;
  popular?: boolean;
  adminSeats: number;
  salesSeats: number | "unlimited";
  features: Record<FeatureKey, boolean>;
}

export const FEATURE_ORDER: FeatureKey[] = [
  "leadUpload",
  "campaignAssign",
  "myTasks",
  "whatsappPretext",
  "followUpQueue",
  "dailyGoal",
  "adminKpi",
  "activityLog",
  "auditLog",
  "exportLeads",
  "prioritySupport",
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    priceMonthly: 199,
    adminSeats: 1,
    salesSeats: 2,
    features: {
      leadUpload: true,
      campaignAssign: true,
      myTasks: true,
      whatsappPretext: true,
      followUpQueue: false,
      dailyGoal: false,
      adminKpi: false,
      activityLog: false,
      auditLog: false,
      exportLeads: false,
      prioritySupport: false,
    },
  },
  {
    id: "pro",
    priceMonthly: 499,
    popular: true,
    adminSeats: 1,
    salesSeats: 8,
    features: {
      leadUpload: true,
      campaignAssign: true,
      myTasks: true,
      whatsappPretext: true,
      followUpQueue: true,
      dailyGoal: true,
      adminKpi: true,
      activityLog: true,
      auditLog: false,
      exportLeads: true,
      prioritySupport: false,
    },
  },
  {
    id: "team",
    priceMonthly: 999,
    adminSeats: 3,
    salesSeats: "unlimited",
    features: {
      leadUpload: true,
      campaignAssign: true,
      myTasks: true,
      whatsappPretext: true,
      followUpQueue: true,
      dailyGoal: true,
      adminKpi: true,
      activityLog: true,
      auditLog: true,
      exportLeads: true,
      prioritySupport: true,
    },
  },
];

export function getTierById(id: TierId): PricingTier {
  const tier = PRICING_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown tier: ${id}`);
  return tier;
}
