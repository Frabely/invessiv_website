import "server-only";

import { getDrizzleDatabaseClient } from "@/server/db/core";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import type { CreateLeadResult } from "@/common/contracts/leads/results/create-lead-result";
import { createLeadValidationService } from "@/server/workspace/leads/services/create-lead/create-lead-validation-service";
import { isDuplicateEmailError } from "@/server/workspace/leads/utils/is-duplicate-email-error";
import { createLeadCoreInTransaction } from "@/server/workspace/leads/services/create-lead-core/create-lead-core";

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
      }),
    );

    return { ok: true, lead };
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return { ok: false, code: LeadErrorCode.EmailExists };
    }
    throw error;
  }
}
