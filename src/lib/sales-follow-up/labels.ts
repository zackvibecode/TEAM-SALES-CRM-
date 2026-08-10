import type { AppCopy } from "@/lib/i18n/get-copy";
import type {
  FollowUpStatusType,
  LeadStatus,
} from "@/lib/sales-follow-up/types";

type Sf = AppCopy["salesFollowUp"];

const LEAD_STATUS_KEYS: Record<LeadStatus, keyof Sf> = {
  New: "statusNew",
  "Follow-Up": "statusFollowUp",
  Interested: "statusInterested",
  KIV: "statusKiv",
  "No Response": "statusNoResponse",
  "Not Interested": "statusNotInterested",
  Booked: "statusBooked",
  Closed: "statusClosed",
};

const FU_STATUS_KEYS: Record<FollowUpStatusType, keyof Sf> = {
  "No Response": "fuStatusNoResponse",
  Replied: "fuStatusReplied",
  Interested: "fuStatusInterested",
  KIV: "fuStatusKiv",
  "Not Interested": "fuStatusNotInterested",
  Booked: "fuStatusBooked",
  "Need Follow-Up": "fuStatusNeedFollowUp",
  "Wrong Number": "fuStatusWrongNumber",
};

export function leadStatusLabel(t: Sf, status: LeadStatus | string): string {
  const key = LEAD_STATUS_KEYS[status as LeadStatus];
  return key ? String(t[key]) : status;
}

export function followUpStatusLabel(t: Sf, status: FollowUpStatusType | string): string {
  const key = FU_STATUS_KEYS[status as FollowUpStatusType];
  return key ? String(t[key]) : status;
}

export function getLeadStatusOptions(t: Sf): { value: LeadStatus; label: string }[] {
  return (Object.keys(LEAD_STATUS_KEYS) as LeadStatus[]).map((value) => ({
    value,
    label: leadStatusLabel(t, value),
  }));
}

export function getFollowUpStatusOptions(
  t: Sf
): { value: FollowUpStatusType; label: string }[] {
  return (Object.keys(FU_STATUS_KEYS) as FollowUpStatusType[]).map((value) => ({
    value,
    label: followUpStatusLabel(t, value),
  }));
}

export function getFollowUpFilterOptions(
  t: Sf
): { value: "all" | "0" | "1" | "2" | "3+" | "overdue"; label: string }[] {
  return [
    { value: "all", label: t.filterAll },
    { value: "0", label: t.filter0 },
    { value: "1", label: t.filter1 },
    { value: "2", label: t.filter2 },
    { value: "3+", label: t.filter3Plus },
    { value: "overdue", label: t.filterOverdue },
  ];
}
