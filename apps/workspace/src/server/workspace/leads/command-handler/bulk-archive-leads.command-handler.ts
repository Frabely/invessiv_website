import "server-only";
import { inArray } from "drizzle-orm";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { StatusChangeOrigin } from "@invessiv/common/constants/activity/status-change-origins";
import type { StatusChangeActivityMetadata } from "@invessiv/common/contracts/activity/status-change-activity-metadata";
import type { BulkArchiveLeadsResult } from "@invessiv/common/contracts/leads/results/bulk-archive-leads-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { activityService } from "@/server/workspace/shared/services/activity-service";

export type BulkArchiveLeadsInput = {
  ids: string[];
};

// TODO(CR #6 / ARCHITECTURE-open-items #1): once an ownership model exists, add
// `where user_id = $caller` so the IDOR vector is closed under multi-tenancy.
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
      await activityService.createActivity(tx, {
        leadId: row.id,
        type: ActivityType.StatusChange,
        body: `${row.lead_status} → ${ContactLeadStatus.Archived}`,
        metadata: {
          previous_status: row.lead_status,
          next_status: ContactLeadStatus.Archived,
          origin: StatusChangeOrigin.BulkArchive,
        } satisfies StatusChangeActivityMetadata,
        actorType: ActorType.System,
      });
    }

    updatedCount = toUpdate.length;
  });

  return { ok: true, updatedCount };
}
