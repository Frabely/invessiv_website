import "server-only";
import { eq } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads, leadSocialProfiles } from "@/server/db/record-configuration";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import { LeadActivityType } from "@/common/constants/leads/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/lead-actor-types";
import type { UpdateLeadResult } from "@/common/contracts/leads/results/update-lead-result";
import { updateLeadValidationService } from "@/server/workspace/leads/services/update-lead/update-lead-validation-service";
import type { UpdateLeadInput } from "@/server/workspace/leads/services/update-lead/update-lead.schema";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/utils/lead-url-normalization-service";
import { isDuplicateEmailError } from "@/server/workspace/leads/utils/is-duplicate-email-error";
import { createLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";

export async function updateLead(
  leadId: string,
  input: unknown,
): Promise<UpdateLeadResult> {
  const existing = await getLeadById(leadId);
  if (!existing) {
    return { ok: false, code: LeadErrorCode.NotFound };
  }

  const validation = updateLeadValidationService.validate(input, existing);
  if (!validation.success) {
    return {
      ok: false,
      code: LeadErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data: UpdateLeadInput = validation.data;
  const db = getDrizzleDatabaseClient();
  const now = new Date();

  const setFields: Record<string, unknown> = { updated_at: now };
  if (data.first_name !== undefined) setFields.first_name = data.first_name;
  if (data.last_name !== undefined) setFields.last_name = data.last_name;
  if (data.company_name !== undefined)
    setFields.company_name = data.company_name;
  if (data.email !== undefined) setFields.email = data.email;
  if (data.phone !== undefined) setFields.phone = data.phone;
  if (data.website_url !== undefined) setFields.website_url = data.website_url;
  if (data.category_id !== undefined) setFields.category_id = data.category_id;
  if (data.score !== undefined) setFields.score = data.score;
  if (data.owner !== undefined) setFields.owner = data.owner;
  if (data.notes !== undefined) setFields.notes = data.notes;
  if (data.improvements !== undefined)
    setFields.improvements = data.improvements;
  if (data.lead_status !== undefined) setFields.lead_status = data.lead_status;

  const isStatusChange =
    data.lead_status !== undefined && data.lead_status !== existing.leadStatus;

  try {
    await db.transaction(async (tx) => {
      await tx.update(leads).set(setFields).where(eq(leads.id, leadId));

      if (isStatusChange) {
        await createLeadActivity(tx, {
          leadId,
          type: LeadActivityType.StatusChange,
          body: `${existing.leadStatus} -> ${data.lead_status}`,
          actorType: LeadActorType.System,
        });
      }

      if (data.social_profiles !== undefined) {
        await tx
          .delete(leadSocialProfiles)
          .where(eq(leadSocialProfiles.lead_id, leadId));

        if (data.social_profiles.length > 0) {
          await tx.insert(leadSocialProfiles).values(
            data.social_profiles.map((p) => ({
              id: crypto.randomUUID(),
              lead_id: leadId,
              platform: p.platform,
              profile_url: p.profile_url,
              normalized_url: normalizeLeadProfileUrl(p.profile_url),
              created_at: now,
              updated_at: now,
            })),
          );
        }
      }
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, code: LeadErrorCode.EmailExists };
    }
    throw error;
  }

  const updated = await getLeadById(leadId);
  if (!updated) throw new Error(`Lead ${leadId} not found after update`);

  return { ok: true, lead: updated };
}
