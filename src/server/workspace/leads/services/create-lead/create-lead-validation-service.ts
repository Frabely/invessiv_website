import type { CreateLeadRequestDto } from "@/common/contracts/leads/create-lead-request.dto";
import { createLeadSchema } from "@/server/workspace/leads/services/create-lead/create-lead.schema";

function validate(input: CreateLeadRequestDto) {
  return createLeadSchema.safeParse(input);
}

export const createLeadValidationService = {
  validate,
};
