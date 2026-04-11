export type ContactSubmitErrorCode =
  | "delivery_unavailable"
  | "internal_error"
  | "invalid_json"
  | "method_not_allowed"
  | "payload_too_large"
  | "rate_limited"
  | "spam_detected"
  | "validation_error";

export type ContactSubmitSuccessResponse = {
  ok: true;
  requestId: string;
};

export type ContactSubmitErrorResponse = {
  code: ContactSubmitErrorCode;
  fieldErrors?: Record<string, string[]>;
  ok: false;
  requestId: string;
};

export type ContactSubmitResponse =
  | ContactSubmitSuccessResponse
  | ContactSubmitErrorResponse;
