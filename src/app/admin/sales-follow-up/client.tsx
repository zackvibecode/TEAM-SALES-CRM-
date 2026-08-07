"use client";

import { useState } from "react";
import { SalesFollowUpDashboard } from "@/components/sales-follow-up/SalesFollowUpDashboard";
import { LeadDetailView } from "@/components/sales-follow-up/LeadDetailView";
import { useParams } from "next/navigation";

export function SalesFollowUpLeadsClient() {
  const params = useParams();
  const leadId = params?.id as string | undefined;

  if (leadId) {
    return (
      <LeadDetailView
        leadId={leadId}
        onBack={() => {
          window.history.back();
        }}
      />
    );
  }

  return <SalesFollowUpDashboard />;
}
