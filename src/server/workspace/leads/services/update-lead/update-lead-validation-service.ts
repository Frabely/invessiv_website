import { updateLeadSchema } from "@/server/workspace/leads/services/update-lead/update-lead.schema";
import type { ExistingLeadValidationState } from "@/common/contracts/leads/validation/existing-lead-validation-state";

function validate(input: unknown, existingLead: ExistingLeadValidationState) {
  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  if (
    parsed.data.email !== undefined &&
    parsed.data.email !== null &&
    existingLead.email !== null &&
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
