import "server-only";
import { eq } from "drizzle-orm";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@invessiv/common/constants/leads/activity/lead-actor-types";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { MarkLeadContactedResult } from "@invessiv/common/contracts/leads/results/mark-lead-contacted-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { leadActivityService } from "@/server/workspace/leads/services/lead-activity-service";

export async function markLeadContacted(
  leadId: string,
): Promise<MarkLeadContactedResult> {
  const db = getDrizzleDatabaseClient();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: leads.id, lead_status: leads.lead_status })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!existing) {
      return { ok: false, code: LeadErrorCode.NotFound };
    }

    if (existing.lead_status === ContactLeadStatus.Contacted) {
      return {
        ok: true,
        leadStatus: ContactLeadStatus.Contacted,
        changed: false,
      };
    }

    await tx
      .update(leads)
      .set({ lead_status: ContactLeadStatus.Contacted, updated_at: new Date() })
      .where(eq(leads.id, leadId));

    await leadActivityService.createLeadActivity(tx, {
      leadId,
      type: LeadActivityType.StatusChange,
      body: `${existing.lead_status} → ${ContactLeadStatus.Contacted}`,
      metadata: {
        previous_status: existing.lead_status,
        next_status: ContactLeadStatus.Contacted,
      },
      actorType: LeadActorType.System,
    });

    return {
      ok: true,
      leadStatus: ContactLeadStatus.Contacted,
      changed: true,
    };
  });
}
