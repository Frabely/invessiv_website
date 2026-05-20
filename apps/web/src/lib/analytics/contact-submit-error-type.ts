import type { ContactSubmitErrorResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";

export function getContactSubmitAnalyticsErrorType(
  response: ContactSubmitErrorResponse,
): (typeof ContactFormSubmitErrorType)[keyof typeof ContactFormSubmitErrorType] {
  if (response.code === "rate_limited") {
    return ContactFormSubmitErrorType.RateLimited;
  }

  if (response.code === "delivery_unavailable") {
    return ContactFormSubmitErrorType.Delivery;
  }

  if (
    response.code === "validation_error" ||
    response.code === "spam_detected"
  ) {
    return ContactFormSubmitErrorType.Validation;
  }

  return ContactFormSubmitErrorType.Generic;
}
