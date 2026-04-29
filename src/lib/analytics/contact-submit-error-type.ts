import type { ContactSubmitErrorResponse } from "@/common/contracts/contact/submit/contact-submit";
import type { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";

export function getContactSubmitAnalyticsErrorType(
  response: ContactSubmitErrorResponse,
): ContactFormSubmitErrorType {
  if (response.code === "rate_limited") {
    return "rate_limited";
  }

  if (response.code === "delivery_unavailable") {
    return "delivery";
  }

  if (
    response.code === "validation_error" ||
    response.code === "spam_detected"
  ) {
    return "validation";
  }

  return "generic";
}
