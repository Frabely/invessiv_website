import type { z } from "zod";
import type { ContactValidationFailure } from "@/common/contracts/contact/validation/contact-validation-result";
import { flattenContactFieldErrors } from "@/server/contact/validation/shared/flatten-contact-field-errors";

export function createValidationErrorResult(
  issues: z.core.$ZodIssue[],
): ContactValidationFailure {
  const fieldErrors = flattenContactFieldErrors(issues);
  const issueCodes = new Set(Object.values(fieldErrors).flat());

  return {
    code: issueCodes.has("spam_detected")
      ? "spam_detected"
      : "validation_error",
    fieldErrors,
    ok: false,
  };
}
