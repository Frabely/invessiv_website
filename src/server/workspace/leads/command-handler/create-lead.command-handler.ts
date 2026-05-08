import "server-only";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leads, leadSocialProfiles } from "@/server/db/record-configuration";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadSource } from "@/common/constants/leads/lead-sources";
import { LeadActivityType } from "@/common/constants/leads/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/lead-actor-types";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { CreateLeadResult } from "@/common/contracts/leads/results/create-lead-result";
import { createLeadValidationService } from "@/server/workspace/leads/services/create-lead/create-lead-validation-service";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/utils/lead-url-normalization-service";
import { isDuplicateEmailError } from "@/server/workspace/leads/utils/is-duplicate-email-error";
import { createLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";

export async function createLead(
  input: CreateLeadRequestDto,
): Promise<CreateLeadResult> {
  const validation = createLeadValidationService.validate(input);
  if (!validation.success) {
    return {
      ok: false,
      code: LeadErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const data = validation.data;
  const db = getDrizzleDatabaseClient();
  const newLeadId = crypto.randomUUID();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(leads).values({
        id: newLeadId,
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
        company_name: data.company_name ?? null,
        email: data.email,
        phone: data.phone ?? null,
        website_url: data.website_url ?? null,
        category_id: data.category_id ?? null,
        score: data.score ?? null,
        source: LeadSource.Manual,
        lead_status: ContactLeadStatus.New,
        owner: data.owner ?? null,
        notes: data.notes ?? null,
        improvements: data.improvements ?? null,
        created_at: now,
        updated_at: now,
      });

      if (data.social_profiles?.length) {
        await tx.insert(leadSocialProfiles).values(
          data.social_profiles.map((p) => ({
            id: crypto.randomUUID(),
            lead_id: newLeadId,
            platform: p.platform,
            profile_url: p.profile_url,
            normalized_url: normalizeLeadProfileUrl(p.profile_url),
            created_at: now,
            updated_at: now,
          })),
        );
      }

      await createLeadActivity(tx, {
        leadId: newLeadId,
        type: LeadActivityType.Note,
        actorType: LeadActorType.System,
      });
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, code: LeadErrorCode.EmailExists };
    }
    throw error;
  }

  const lead = await getLeadById(newLeadId);
  if (!lead)
    throw new Error(`Created lead ${newLeadId} not found after insert`);

  return { ok: true, lead };
}
