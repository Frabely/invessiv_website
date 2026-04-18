export const CONTACT_SUBMIT_ERROR_CODE = {
  DeliveryUnavailable: "delivery_unavailable",
  InternalError: "internal_error",
  InvalidJson: "invalid_json",
  MethodNotAllowed: "method_not_allowed",
  PayloadTooLarge: "payload_too_large",
  RateLimited: "rate_limited",
  SpamDetected: "spam_detected",
  ValidationError: "validation_error",
} as const;

export type ContactSubmitErrorCode =
  (typeof CONTACT_SUBMIT_ERROR_CODE)[keyof typeof CONTACT_SUBMIT_ERROR_CODE];
