"use client";

import { SalesPageShell } from "@/components/i18n/PageShells";
import { DailyGoalPanel } from "@/components/sales/DailyGoalPanel";
import { CustomersClient } from "./client";

interface BatchOption {
  id: string;
  label: string;
}

interface Props {
  fullName?: string;
  email?: string;
  batches: BatchOption[];
  whatsappPretext: string | null;
  totalCount: number;
  pendingCount: number;
  effectiveRole: string;
  userEmail: string;
  dbError?: string;
}

export function SalesCustomersShell(props: Props) {
  const subtitle = [props.fullName, props.email].filter(Boolean).join(" · ");

  return (
    <SalesPageShell section="customers" subtitle={subtitle} className="space-y-6">
      {props.dbError && (
        <div className="alert-error">Cannot load your leads: {props.dbError}</div>
      )}

      {!props.dbError && props.effectiveRole !== "sales" && (
        <div className="alert-error">
          Account role is &quot;{props.effectiveRole || "empty"}&quot;, not sales.
        </div>
      )}

      <DailyGoalPanel />

      <CustomersClient
        initialLeads={[]}
        batches={props.batches}
        pendingCount={props.pendingCount}
        totalCount={props.totalCount}
        userEmail={props.userEmail}
        whatsappPretext={props.whatsappPretext}
      />
    </SalesPageShell>
  );
}
