import type { SupabaseClient } from "@supabase/supabase-js";
import { dateCreatedToISO } from "@/lib/lead-date-created";
import type { ParsedLeadRow } from "@/lib/parse-leads";
import { formatWhatsAppNumber } from "@/lib/whatsapp";

export type LeadDatePatch = {
  whatsapp: string;
  created_at: string;
  list_order?: number;
};

export function buildLeadDatePatches(leads: ParsedLeadRow[]): LeadDatePatch[] {
  const patches: LeadDatePatch[] = [];
  for (const l of leads) {
    const iso = l.date_created ? dateCreatedToISO(l.date_created) : null;
    if (!iso) continue;
    patches.push({
      whatsapp: formatWhatsAppNumber(l.whatsapp),
      created_at: iso,
      ...(l.list_order != null ? { list_order: l.list_order } : {}),
    });
  }
  return patches;
}

export async function batchUpdateLeadDatesForOwner(
  db: SupabaseClient,
  ownerUserId: string,
  patches: LeadDatePatch[],
  chunkSize = 50
): Promise<{ updated: number; failed: number }> {
  const now = new Date().toISOString();
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < patches.length; i += chunkSize) {
    const chunk = patches.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(async (patch) => {
        const row: Record<string, unknown> = {
          created_at: patch.created_at,
          updated_at: now,
        };
        if (patch.list_order != null) row.list_order = patch.list_order;

        const { data, error } = await db
          .from("leads")
          .update(row)
          .eq("owner_user_id", ownerUserId)
          .eq("whatsapp", patch.whatsapp)
          .select("id");

        return { ok: !error && (data?.length ?? 0) > 0, error };
      })
    );

    for (const r of results) {
      if (r.ok) updated++;
      else failed++;
    }
  }

  return { updated, failed };
}
