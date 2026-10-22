import type { ContactSubmitErrorResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { AnalyticsFormFailureReason } from "@/common/constants/analytics/analytics-form";

export function getContactSubmitFailureReason(
  response: ContactSubmitErrorResponse,
): AnalyticsFormFailureReason {
  if (response.code === CONTACT_SUBMIT_ERROR_CODE.RateLimited) {
    return AnalyticsFormFailureReason.RateLimited;
  }

  if (response.code === CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable) {
    return AnalyticsFormFailureReason.Delivery;
  }

  if (
    response.code === CONTACT_SUBMIT_ERROR_CODE.ValidationError ||
    response.code === CONTACT_SUBMIT_ERROR_CODE.SpamDetected
  ) {
    return AnalyticsFormFailureReason.Validation;
  }

  return AnalyticsFormFailureReason.Generic;
}
