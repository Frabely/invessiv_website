export type ContactSubmitErrorCode =
  | "delivery_unavailable"
  | "internal_error"
  | "invalid_json"
  | "method_not_allowed"
  | "payload_too_large"
  | "rate_limited"
  | "spam_detected"
  | "validation_error";
