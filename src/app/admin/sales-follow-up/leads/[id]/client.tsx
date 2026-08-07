"use client";

import { useRouter } from "next/navigation";
import { LeadDetailView } from "@/components/sales-follow-up/LeadDetailView";

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter();

  return (
    <LeadDetailView
      leadId={leadId}
      onBack={() => router.push("/admin/sales-follow-up")}
    />
  );
}
