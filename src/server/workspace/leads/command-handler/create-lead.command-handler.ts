import "server-only";

import { getDrizzleDatabaseClient } from "@/server/db/core";
import { LeadSource } from "@invessiv/common/constants/leads/sources/lead-sources";
import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@invessiv/common/contracts/leads/create-lead-request.dto";
import type { CreateLeadResult } from "@invessiv/common/contracts/leads/results/create-lead-result";
import { createLeadValidationService } from "@/server/workspace/leads/services/create-lead/create-lead-validation-service";
import { DuplicateCompanyNameError } from "@/server/workspace/leads/shared/duplicate-company-name-error.class";
import { isDuplicateEmailError } from "@/server/workspace/leads/shared/is-duplicate-email-error";
import { createLeadCoreInTransaction } from "@/server/workspace/leads/shared/create-lead-core";

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

  try {
    const lead = await db.transaction((tx) =>
      createLeadCoreInTransaction(tx, data, {
        source: LeadSource.Manual,
        activityType: LeadActivityType.Note,
        statusOverride: data.lead_status,
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
    throw error;
  }
}
