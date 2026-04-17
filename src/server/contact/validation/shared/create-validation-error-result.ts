import type { z } from "zod";
import { CONTACT_SUBMIT_ERROR_CODE } from "@/common/contracts/contact/submit/contact-submit-error-code";
import type { ContactValidationFailure } from "@/common/contracts/contact/validation/contact-validation-result";
import { flattenContactFieldErrors } from "@/server/contact/validation/shared/flatten-contact-field-errors";
import { CONTACT_VALIDATION_FIELD_ERROR_CODE } from "@/server/contact/validation/shared/contact-validation-field-error-code";

export function createValidationErrorResult(
  issues: z.core.$ZodIssue[],
): ContactValidationFailure {
  const fieldErrors = flattenContactFieldErrors(issues);
  const issueCodes = new Set(Object.values(fieldErrors).flat());

  return {
    code: issueCodes.has(CONTACT_VALIDATION_FIELD_ERROR_CODE.SpamDetected)
      ? CONTACT_SUBMIT_ERROR_CODE.SpamDetected
      : CONTACT_SUBMIT_ERROR_CODE.ValidationError,
    fieldErrors,
    ok: false,
  };
}
