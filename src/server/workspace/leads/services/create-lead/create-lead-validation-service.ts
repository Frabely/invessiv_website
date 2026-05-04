import { createLeadSchema } from "@/server/workspace/leads/services/create-lead/create-lead.schema";

function validate(input: unknown) {
  return createLeadSchema.safeParse(input);
}

export const createLeadValidationService = {
  validate,
};
