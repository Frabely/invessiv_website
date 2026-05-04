import { updateLeadSchema } from "@/server/workspace/leads/services/update-lead/update-lead.schema";

function validate(input: unknown) {
  return updateLeadSchema.safeParse(input);
}

export const updateLeadValidationService = {
  validate,
};
