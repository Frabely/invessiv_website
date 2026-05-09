import "server-only";
import { inArray } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads } from "@/server/db/record-configuration";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import type { BulkEditLeadsInput } from "@/common/contracts/leads/bulk-edit-leads-input";
import type { BulkEditLeadsResult } from "@/common/contracts/leads/results/bulk-edit-leads-result";
import { createLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";

export async function bulkEditLeads(
  input: BulkEditLeadsInput,
): Promise<BulkEditLeadsResult> {
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

    const toUpdate = existing.filter((row) => row.lead_status !== input.status);
    if (toUpdate.length === 0) return;

    await tx
      .update(leads)
      .set({ lead_status: input.status, updated_at: now })
      .where(
        inArray(
          leads.id,
          toUpdate.map((r) => r.id),
        ),
      );

    for (const row of toUpdate) {
      await createLeadActivity(tx, {
        leadId: row.id,
        type: LeadActivityType.StatusChange,
        body: `${row.lead_status} → ${input.status}`,
        metadata: {
          previous_status: row.lead_status,
          next_status: input.status,
        },
        actorType: LeadActorType.System,
      });
    }

    updatedCount = toUpdate.length;
  });

  return { ok: true, updatedCount };
}
