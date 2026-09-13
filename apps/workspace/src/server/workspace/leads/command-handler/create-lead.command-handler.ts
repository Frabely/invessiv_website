import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@invessiv/common/contracts/leads/create-lead-request.dto";
import type { CreateLeadResult } from "@invessiv/common/contracts/leads/results/create-lead-result";
import { createLeadValidationService } from "@/server/workspace/leads/services/create-lead/create-lead-validation-service";
import { DuplicateCompanyNameError } from "@/server/workspace/leads/shared/duplicate-company-name-error.class";
import { DuplicateSocialProfileError } from "@/server/workspace/leads/shared/duplicate-social-profile-error.class";
import { isDuplicateEmailError } from "@/server/workspace/leads/shared/is-duplicate-email-error";
import { createLeadCoreInTransaction } from "@/server/workspace/leads/shared/create-lead-core";

export async function createLead(
  input: CreateLeadRequestDto,
  actorUserId: string,
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

  try {
    const lead = await db.transaction((tx) =>
      createLeadCoreInTransaction(tx, data, {
        source: LeadSource.Manual,
        activityType: ActivityType.Note,
        statusOverride: data.lead_status,
        actorUserId,
      }),
    );

    return { ok: true, lead };
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, code: LeadErrorCode.EmailExists };
    }
    if (error instanceof DuplicateCompanyNameError) {
      return { ok: false, code: LeadErrorCode.CompanyNameExists };
    }
    if (error instanceof DuplicateSocialProfileError) {
      return { ok: false, code: LeadErrorCode.SocialProfileExists };
    }
    throw error;
  }
}
