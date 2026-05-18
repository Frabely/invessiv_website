import "server-only";
import { inArray } from "drizzle-orm";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import type { BulkArchiveLeadsResult } from "@/common/contracts/leads/results/bulk-archive-leads-result";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads } from "@/server/db/record-configuration";
import { leadActivityService } from "@/server/workspace/leads/services/lead-activity-service";

export type BulkArchiveLeadsInput = {
  ids: string[];
};

// TODO(CR #6 / ARCHITECTURE-open-items #1): wenn Ownership-Modell eingeführt wird,
// `where user_id = $caller` ergänzen, damit IDOR-Vektor bei Multi-Tenancy geschlossen ist.
export async function bulkArchiveLeads(
  input: BulkArchiveLeadsInput,
): Promise<BulkArchiveLeadsResult> {
  if (input.ids.length === 0) {
    return { ok: true, updatedCount: 0 };
  }

  const db = getDrizzleDatabaseClient();
  const now = new Date();

  let updatedCount = 0;

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: leads.id, lead_status: leads.lead_status })
      .from(leads)
      .where(inArray(leads.id, input.ids));

    const toUpdate = existing.filter(
      (row) => row.lead_status !== ContactLeadStatus.Archived,
    );
    if (toUpdate.length === 0) return;

    await tx
      .update(leads)
      .set({ lead_status: ContactLeadStatus.Archived, updated_at: now })
      .where(
        inArray(
          leads.id,
          toUpdate.map((row) => row.id),
        ),
      );

    for (const row of toUpdate) {
      await leadActivityService.createLeadActivity(tx, {
        leadId: row.id,
        type: LeadActivityType.StatusChange,
        body: `${row.lead_status} → ${ContactLeadStatus.Archived}`,
        metadata: {
          previous_status: row.lead_status,
          next_status: ContactLeadStatus.Archived,
        },
        actorType: LeadActorType.System,
      });
    }

    updatedCount = toUpdate.length;
  });

  return { ok: true, updatedCount };
}
