import type { ContactSubmitErrorResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";

export function getContactSubmitAnalyticsErrorType(
  response: ContactSubmitErrorResponse,
): (typeof ContactFormSubmitErrorType)[keyof typeof ContactFormSubmitErrorType] {
  if (response.code === CONTACT_SUBMIT_ERROR_CODE.RateLimited) {
    return ContactFormSubmitErrorType.RateLimited;
  }

  if (response.code === CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable) {
    return ContactFormSubmitErrorType.Delivery;
  }

  if (
    response.code === CONTACT_SUBMIT_ERROR_CODE.ValidationError ||
    response.code === CONTACT_SUBMIT_ERROR_CODE.SpamDetected
  ) {
    return ContactFormSubmitErrorType.Validation;
  }

  return ContactFormSubmitErrorType.Generic;
}
