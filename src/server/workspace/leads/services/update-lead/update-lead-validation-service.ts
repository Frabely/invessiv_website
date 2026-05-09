import { updateLeadSchema } from "@/server/workspace/leads/services/update-lead/update-lead.schema";
import {
  hasAtLeastOneLeadName,
  missingLeadNameError,
} from "@/server/workspace/leads/services/shared/lead-name-validation";
import type { ExistingLeadValidationState } from "@/common/contracts/leads/validation/existing-lead-validation-state";

function validate(input: unknown, existingLead: ExistingLeadValidationState) {
  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const nextLastName =
    parsed.data.last_name !== undefined
      ? parsed.data.last_name
      : existingLead.lastName;
  const nextCompanyName =
    parsed.data.company_name !== undefined
      ? parsed.data.company_name
      : existingLead.companyName;

  if (
    !hasAtLeastOneLeadName({
      company_name: nextCompanyName,
      last_name: nextLastName,
    })
  ) {
    return {
      success: false as const,
      error: missingLeadNameError(),
    };
  }

  if (
    parsed.data.email !== undefined &&
    parsed.data.email.trim().toLowerCase() ===
      existingLead.email.trim().toLowerCase()
  ) {
    const dataWithoutUnchangedEmail = { ...parsed.data };
    delete dataWithoutUnchangedEmail.email;
    return {
      success: true as const,
      data: dataWithoutUnchangedEmail,
    };
  }

  return parsed;
}

export const updateLeadValidationService = {
  validate,
};
