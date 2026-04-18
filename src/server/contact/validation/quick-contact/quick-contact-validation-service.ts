import type { ContactValidationResult } from "@/common/contracts/contact/validation/contact-validation-result";
import {
  quickContactSchema,
  type QuickContactValidationData,
} from "@/server/contact/validation/quick-contact/quick-contact.schema";
import { createValidationErrorResult } from "@/server/contact/validation/shared/create-validation-error-result";

function validate(
  input: unknown,
): ContactValidationResult<QuickContactValidationData> {
  const parsedPayload = quickContactSchema.safeParse(input);
  if (!parsedPayload.success) {
    return createValidationErrorResult(parsedPayload.error.issues);
  }

  return {
    data: parsedPayload.data,
    ok: true,
  };
}

export const quickContactValidationService = {
  validate,
};
