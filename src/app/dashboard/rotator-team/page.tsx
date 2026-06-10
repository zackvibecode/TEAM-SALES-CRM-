import AppLayout from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { RotatorSubNav } from "@/components/rotator/RotatorSubNav";
import { RotatorOverviewClient } from "./client";

export const dynamic = "force-dynamic";

export default function RotatorTeamPage() {
  return (
    <AppLayout role="admin">
      <div className="dashboard-shell space-y-6">
        <PageHeader
          badge="Admin"
          title="Rotator Team"
          subtitle="WhatsApp rotator landing pages, sales rotation, and click analytics"
          compact
        />
        <RotatorSubNav />
        <RotatorOverviewClient />
      </div>
    </AppLayout>
  );
}
