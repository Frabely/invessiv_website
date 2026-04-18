import type { ContactValidationResult } from "@/common/contracts/contact/validation/contact-validation-result";
import {
  projectRequestSchema,
  type ProjectRequestValidationData,
} from "@/server/contact/validation/project-request/project-request.schema";
import { createValidationErrorResult } from "@/server/contact/validation/shared/create-validation-error-result";

function validate(
  input: unknown,
): ContactValidationResult<ProjectRequestValidationData> {
  const parsedPayload = projectRequestSchema.safeParse(input);
  if (!parsedPayload.success) {
    return createValidationErrorResult(parsedPayload.error.issues);
  }

  return {
    data: parsedPayload.data,
    ok: true,
  };
}

export const projectRequestValidationService = {
  validate,
};
